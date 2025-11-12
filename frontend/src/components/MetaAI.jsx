import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MetaAI = ({ isOpen, onClose, currentUser = {} }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const aiResponses = {
    greeting: ['Hi! How can I help you today?', 'Hello! What would you like to know?', 'Hey there! What can I assist with?'],
    help: ['I can help you with various tasks. Try asking me about your chats, settings, or getting suggestions!', 'I\'m here to make your experience better. Ask me anything!'],
    suggestions: ['Check out trending topics', 'Schedule a message', 'Find chat backups', 'Get chat suggestions'],
    default: ['That\'s interesting! Tell me more.', 'I understand. What else?', 'Got it! How can I help?']
  };

  const suggestedReplies = [
    '💡 Help me compose a message',
    '🔍 Search my chats',
    '⭐ Show recommendations',
    '🎯 Daily insights'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text = inputValue) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = aiResponses.default[Math.floor(Math.random() * aiResponses.default.length)];
      setMessages(prev => [...prev, { type: 'ai', text: response, timestamp: new Date() }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestedReply = (reply) => {
    const cleanReply = reply.replace(/^[^\s]*\s/, '');
    sendMessage(cleanReply);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-4 right-4 w-96 h-screen md:h-96 md:max-h-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl flex flex-col z-50 border border-cyan-500/20"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 p-4 rounded-t-2xl flex items-center justify-between border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">🤖</span>
            </div>
            <div>
              <h3 className="text-white font-bold">Meta AI</h3>
              <p className="text-xs text-gray-400">Always here to help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-3xl mb-2">🤖</div>
              <h4 className="text-white font-bold">Meta AI Assistant</h4>
              <p className="text-gray-400 text-sm mt-2">Ask me anything and I\'ll help you out!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-none'
                      : 'bg-gray-700 text-gray-100 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))
          )}
          
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Replies */}
        {messages.length > 0 && !isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-2 space-y-2 max-h-24 overflow-y-auto border-t border-gray-700"
          >
            <p className="text-xs text-gray-500">Suggested replies:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedReplies.map((reply, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSuggestedReply(reply)}
                  className="text-xs bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/40 hover:to-purple-500/40 text-cyan-300 px-3 py-1.5 rounded-full border border-cyan-500/30 transition-all"
                >
                  {reply}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-700 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask Meta AI..."
            className="flex-1 bg-gray-700 text-white placeholder-gray-500 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <button
            onClick={() => sendMessage()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-cyan-500/50"
          >
            Send
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MetaAI;
