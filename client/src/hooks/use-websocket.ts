import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';

interface WebSocketEvent {
  table: string;
  data?: any;
  id?: string | number;
  storeId?: number;
  timestamp: string;
}

interface UseWebSocketOptions {
  enabled?: boolean;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { enabled = true, autoConnect = true } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Initialize WebSocket connection
  const connect = () => {
    if (!enabled || !user || socketRef.current?.connected) return;

    console.log('🔗 Connecting to WebSocket server...');
    
    const socket = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Manual disconnect, don't reconnect
        return;
      }
      
      setIsReconnecting(true);
    });

    socket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error.message);
      setIsConnected(false);
      setIsReconnecting(true);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      setIsReconnecting(false);
    });

    socket.on('reconnect_failed', () => {
      console.error('💥 WebSocket reconnection failed');
      setIsReconnecting(false);
    });

    // Real-time data events
    socket.on('data:created', (event: WebSocketEvent) => {
      console.log(`📝 CREATE event for ${event.table}:`, event.data);
      handleCreateEvent(event);
    });

    socket.on('data:updated', (event: WebSocketEvent) => {
      console.log(`✏️ UPDATE event for ${event.table}:${event.id}:`, event.data);
      handleUpdateEvent(event);
    });

    socket.on('data:deleted', (event: WebSocketEvent) => {
      console.log(`🗑️ DELETE event for ${event.table}:${event.id}`);
      handleDeleteEvent(event);
    });

    // Subscribe to relevant data based on user role
    subscribeToUserData(socket);
  };

  // Disconnect WebSocket
  const disconnect = () => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsReconnecting(false);
    }
  };

  // Subscribe to data based on user permissions
  const subscribeToUserData = (socket: Socket) => {
    if (!user) return;

    // Subscribe to global tables that user has access to
    const globalTables = ['users', 'stores'];
    
    // Subscribe to store-specific data based on user role
    if (user.role === 'administrasi') {
      // Admin can see all data
      ['customers', 'products', 'sales', 'attendance', 'cashflow', 'payroll', 'piutang'].forEach(table => {
        socket.emit('subscribe', { table });
      });
    } else {
      // Regular users see store-specific data
      // Note: We'll get user stores from an API call or context
      // For now, subscribing to global data
      ['customers', 'products', 'sales', 'attendance', 'cashflow', 'piutang'].forEach(table => {
        socket.emit('subscribe', { table });
      });
    }

    console.log(`📡 Subscribed to real-time data for ${user.role} role`);
  };

  // Handle CREATE events
  const handleCreateEvent = (event: WebSocketEvent) => {
    const { table, data, storeId } = event;
    
    // Update relevant queries
    const queryKeys = getQueryKeysForTable(table, storeId);
    queryKeys.forEach(queryKey => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          // Add new item to array
          return [...oldData, data];
        } else if (oldData.data && Array.isArray(oldData.data)) {
          // Paginated data structure
          return {
            ...oldData,
            data: [...oldData.data, data]
          };
        }
        
        return oldData;
      });
    });

    // Invalidate related queries to refetch
    queryClient.invalidateQueries({ queryKey: ['/api/' + table] });
  };

  // Handle UPDATE events
  const handleUpdateEvent = (event: WebSocketEvent) => {
    const { table, id, data, storeId } = event;
    
    const queryKeys = getQueryKeysForTable(table, storeId);
    queryKeys.forEach(queryKey => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          // Update item in array
          return oldData.map((item: any) => 
            item.id === id ? { ...item, ...data } : item
          );
        } else if (oldData.data && Array.isArray(oldData.data)) {
          // Paginated data structure
          return {
            ...oldData,
            data: oldData.data.map((item: any) => 
              item.id === id ? { ...item, ...data } : item
            )
          };
        }
        
        return oldData;
      });
    });

    // Also invalidate specific item query
    queryClient.invalidateQueries({ queryKey: ['/api/' + table, id] });
  };

  // Handle DELETE events
  const handleDeleteEvent = (event: WebSocketEvent) => {
    const { table, id, storeId } = event;
    
    const queryKeys = getQueryKeysForTable(table, storeId);
    queryKeys.forEach(queryKey => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        if (Array.isArray(oldData)) {
          // Remove item from array
          return oldData.filter((item: any) => item.id !== id);
        } else if (oldData.data && Array.isArray(oldData.data)) {
          // Paginated data structure
          return {
            ...oldData,
            data: oldData.data.filter((item: any) => item.id !== id)
          };
        }
        
        return oldData;
      });
    });

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['/api/' + table] });
  };

  // Get relevant query keys for a table
  const getQueryKeysForTable = (table: string, storeId?: number) => {
    const keys = [
      ['/api/' + table],
      ['/api/' + table, 'all'],
    ];

    if (storeId) {
      keys.push(['/api/' + table, 'store', storeId]);
    }

    return keys;
  };

  // Subscribe to specific table/store
  const subscribe = (table: string, storeId?: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { table, storeId });
      console.log(`📡 Subscribed to ${table}${storeId ? `:${storeId}` : ''}`);
    }
  };

  // Unsubscribe from specific table/store
  const unsubscribe = (table: string, storeId?: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', { table, storeId });
      console.log(`📡 Unsubscribed from ${table}${storeId ? `:${storeId}` : ''}`);
    }
  };

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (autoConnect && user && enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, enabled, autoConnect]);

  return {
    isConnected,
    isReconnecting,
    connectedUsers,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    socket: socketRef.current,
  };
}