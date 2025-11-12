import React, { createContext, useEffect, useState } from 'react';
import { initializeSocket } from '../services/socket';

export const SocketContext = createContext();

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user) return;

    const newSocket = initializeSocket(user.id);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('usersUpdate', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', message);
    }
  };

  const value = {
    socket,
    isConnected,
    messages,
    users,
    sendMessage,
    setMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
