import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Create socket context
const SocketContext = createContext(null);

/**
 * Custom hook to use socket context
 * @returns {Object} Socket instance and connection status
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * Socket Provider Component
 * Manages socket connection and provides socket instance
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  // Get backend URL from environment variables
  // Use empty string for relative URL (same origin)
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const token = localStorage.getItem('token');
    const socketInstance = io(backendUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
    });

    // Clean up on unmount
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [backendUrl, isAuthenticated]);

  // Context value
  const contextValue = {
    socket,
    isConnected,
    // Helper methods
    emit: (event, data) => socket?.emit(event, data),
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
      return () => {};
    },
    off: (event, callback) => socket?.off(event, callback),
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
