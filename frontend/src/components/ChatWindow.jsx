import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Stories from './Stories';

const ChatWindow = ({ onlineUsers = [], recentChats = [], currentUser = {} }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Sarah', avatar: '👩', text: 'Hey! How are you?', timestamp: '2:30 PM', isOwn: false },
    { id: 2, sender: 'You', avatar: '👨', text: 'Hey Sarah! Doing great!', timestamp: '2:31 PM', isOwn: true },
    { id: 3, sender: 'Sarah', avatar: '👩', text: 'That\'s awesome! 🎉', timestamp: '2:32 PM', isOwn: false },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showStories, setShowStories] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChat, setSelectedChat] = useState(0);
  const [reactions, setReactions] = useState({});
  const messagesEndRef = useRef(null);

  const reactionOptions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      sender: 'You',
      avatar: '👨',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    
    setMessages([...messages, newMessage]);
    setInputValue('');
    setIsTyping(true);
    
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        sender: 'Sarah',
        avatar: '👩',
        text: 'That sounds great! 😊',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  const toggleReaction = (messageId, emoji) => {
    setReactions(prev => ({
      ...prev,
      [messageId]: prev[messageId] === emoji ? null : emoji,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col rounded-lg overflow-hidden border border-cyan-500/20"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4 flex items-center justify-between border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-lg font-bold">👩</div>
          <div>
            <h3 className="text-white font-bold">Sarah Johnson</h3>
            <p className="text-xs text-green-400">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="text-cyan-400 hover:text-cyan-300 transition-colors">📞</motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="text-cyan-400 hover:text-cyan-300 transition-colors">📹</motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setShowStories(!showStories)} className="text-cyan-400 hover:text-cyan-300 transition-colors">📖</motion.button>
        </div>
      </div>

      {/* Stories */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 border-b border-gray-700 flex items-center gap-3 overflow-x-auto bg-gray-800/50"
          >
            {['Sarah', 'Emma', 'Mike', 'Alex'].map((name, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-cyan-400/50 hover:ring-cyan-400 transition-all">
                  {['👩', '👱‍♀️', '👨', '👴'][idx]}
                </div>
                <span className="text-xs text-gray-300">{name}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
          >
            {!msg.isOwn && <span className="text-xl">{msg.avatar}</span>}
            <div className="flex flex-col items-start">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.isOwn
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-100 rounded-bl-none'
                }`}
              >
                {msg.text}
              </motion.div>
              {reactions[msg.id] && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-lg ml-2 mt-1"
                >
                  {reactions[msg.id]}
                </motion.div>
              )}
            </div>
            {msg.isOwn && <span className="text-xl">{msg.avatar}</span>}
          </motion.div>
        ))}
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span className="text-xl">👩</span>
            <div className="flex items-center gap-1 bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-none">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-gray-700 bg-gradient-to-t from-slate-900 to-slate-800">
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl">➕</motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="text-cyan-400 hover:text-cyan-300 transition-colors text-xl">😊</motion.button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Aa"
            className="flex-1 bg-gray-700 text-white placeholder-gray-500 px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-full font-bold transition-all hover:shadow-lg hover:shadow-cyan-500/50"
          >
            ❤️
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
