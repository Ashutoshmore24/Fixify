import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinLab: (labId: string) => void;
  leaveLab: (labId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to backend Socket.IO
    const s = io(window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user]);

  const joinLab = (labId: string) => {
    if (socket && isConnected) {
      socket.emit('join:lab', labId);
    }
  };

  const leaveLab = (labId: string) => {
    if (socket && isConnected) {
      socket.emit('leave:lab', labId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinLab, leaveLab }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
