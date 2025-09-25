import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuth } from '@/hooks/use-auth';

interface WebSocketContextValue {
  isConnected: boolean;
  isReconnecting: boolean;
  connectedUsers: number;
  subscribe: (table: string, storeId?: number) => void;
  unsubscribe: (table: string, storeId?: number) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user } = useAuth();
  const {
    isConnected,
    isReconnecting,
    connectedUsers,
    subscribe,
    unsubscribe,
  } = useWebSocket({
    enabled: !!user,
    autoConnect: true,
  });

  // Auto-subscribe to commonly used data when connected
  useEffect(() => {
    if (isConnected && user) {
      // Subscribe to essential data
      subscribe('stores');
      subscribe('users');
      
      // Subscribe based on user role
      if (user.role === 'administrasi') {
        // Admin gets all data
        ['customers', 'products', 'sales', 'attendance', 'cashflow', 'payroll', 'proposals'].forEach(table => {
          subscribe(table);
        });
      } else {
        // Regular users get basic data
        ['customers', 'products', 'sales', 'attendance'].forEach(table => {
          subscribe(table);
        });
      }
    }
  }, [isConnected, user, subscribe]);

  const value: WebSocketContextValue = {
    isConnected,
    isReconnecting,
    connectedUsers,
    subscribe,
    unsubscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

// Connection status indicator component
export function WebSocketStatus() {
  const { isConnected, isReconnecting, connectedUsers } = useWebSocketContext();

  if (isReconnecting) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span>Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600 text-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span>Live ({connectedUsers} users)</span>
    </div>
  );
}