import { useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import { apiCall } from '../services/api';

export const useChat = () => {
  const { sendMessage, messages } = useSocket();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall.get('/chats');
      setChats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendChatMessage = useCallback((chatId, content) => {
    const message = { chatId, content, timestamp: Date.now() };
    sendMessage(message);
  }, [sendMessage]);

  return {
    chats,
    messages,
    loading,
    error,
    fetchChats,
    sendChatMessage
  };
};

export default useChat;
