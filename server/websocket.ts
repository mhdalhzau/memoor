import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import session from "express-session";
import { storage } from "./storage";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  storeIds?: number[];
}

export class RealtimeService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(server: HTTPServer, sessionMiddleware: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        credentials: true
      }
    });

    // Convert Express session middleware to Socket.IO middleware
    this.io.use((socket, next) => {
      sessionMiddleware(socket.request as any, {} as any, next as any);
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const session = (socket.request as any).session;
        
        if (!session?.passport?.user) {
          return next(new Error('Authentication required'));
        }

        const userId = session.passport.user;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user info to socket
        socket.userId = user.id;
        socket.userRole = user.role;
        
        // Get user's accessible stores
        const userStores = await storage.getUserStores(user.id);
        socket.storeIds = user.role === 'administrasi' 
          ? (await storage.getAllStores()).map(s => s.id)
          : userStores.map(s => s.id);

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected via WebSocket`);
      
      // Add to connected users
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
      }

      // Join store rooms based on user access
      if (socket.storeIds) {
        socket.storeIds.forEach(storeId => {
          socket.join(`store:${storeId}`);
        });
        console.log(`User ${socket.userId} joined stores: ${socket.storeIds.join(', ')}`);
      }

      // Handle client requesting to subscribe to specific data
      socket.on('subscribe', (data: { table: string, storeId?: number }) => {
        const { table, storeId } = data;
        
        // Verify store access
        if (storeId && !socket.storeIds?.includes(storeId)) {
          socket.emit('error', { message: 'No access to this store' });
          return;
        }

        const roomName = storeId ? `${table}:${storeId}` : table;
        socket.join(roomName);
        console.log(`User ${socket.userId} subscribed to ${roomName}`);
      });

      socket.on('unsubscribe', (data: { table: string, storeId?: number }) => {
        const { table, storeId } = data;
        const roomName = storeId ? `${table}:${storeId}` : table;
        socket.leave(roomName);
        console.log(`User ${socket.userId} unsubscribed from ${roomName}`);
      });

      socket.on('disconnect', (reason) => {
        console.log(`User ${socket.userId} disconnected: ${reason}`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });
    });
  }

  // Broadcast CRUD events to appropriate rooms
  public broadcastCreate(table: string, data: any, storeId?: number) {
    const rooms = this.getRoomsForEvent(table, storeId);
    rooms.forEach(room => {
      this.io.to(room).emit('data:created', {
        table,
        data,
        storeId,
        timestamp: new Date().toISOString()
      });
    });
    console.log(`Broadcasted CREATE event for ${table} to rooms: ${rooms.join(', ')}`);
  }

  public broadcastUpdate(table: string, id: string | number, data: any, storeId?: number) {
    const rooms = this.getRoomsForEvent(table, storeId);
    rooms.forEach(room => {
      this.io.to(room).emit('data:updated', {
        table,
        id,
        data,
        storeId,
        timestamp: new Date().toISOString()
      });
    });
    console.log(`Broadcasted UPDATE event for ${table}:${id} to rooms: ${rooms.join(', ')}`);
  }

  public broadcastDelete(table: string, id: string | number, storeId?: number) {
    const rooms = this.getRoomsForEvent(table, storeId);
    rooms.forEach(room => {
      this.io.to(room).emit('data:deleted', {
        table,
        id,
        storeId,
        timestamp: new Date().toISOString()
      });
    });
    console.log(`Broadcasted DELETE event for ${table}:${id} to rooms: ${rooms.join(', ')}`);
  }

  private getRoomsForEvent(table: string, storeId?: number): string[] {
    const rooms = [table]; // Global table room
    
    if (storeId) {
      rooms.push(`${table}:${storeId}`); // Store-specific room
      rooms.push(`store:${storeId}`); // Store general room
    }
    
    return rooms;
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get the Socket.IO instance for advanced usage
  public getIO(): SocketIOServer {
    return this.io;
  }
}

let realtimeService: RealtimeService | null = null;

export function initializeRealtimeService(server: HTTPServer, sessionMiddleware: any): RealtimeService {
  realtimeService = new RealtimeService(server, sessionMiddleware);
  return realtimeService;
}

export function getRealtimeService(): RealtimeService | null {
  return realtimeService;
}