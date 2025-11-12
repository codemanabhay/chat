const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const axios = require('axios');

// OpenRouter configuration with failover models
const OPENROUTER_MODELS = [
  {
    name: 'deepseek/deepseek-chat-v3.1:free',
    apiKey: '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',
  },
  {
    name: 'openai/gpt-oss-20b:free',
    apiKey: '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',
  },
  {
    name: 'google/gemma-3n-e2b-it:free',
    apiKey: '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',
  },
];

// Store AI chat history in memory (in production, use database)
const aiChatHistory = new Map();

const aiQuestions = [
  "How can I help you today?",
  "What would you like to know more about?",
  "Is there anything else you'd like to discuss?",
  "Would you like me to elaborate on anything?",
];

// Call OpenRouter API with failover
async function callOpenRouterAI(messages, modelIndex = 0) {
  if (modelIndex >= OPENROUTER_MODELS.length) {
    throw new Error('All AI models failed');
  }

  const model = OPENROUTER_MODELS[modelIndex];

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model.name,
        messages: messages,
      },
      {
        headers: {
          Authorization: `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'TweekChat',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(`Model ${model.name} failed:`, error.message);
    
    // Try next model
    return callOpenRouterAI(messages, modelIndex + 1);
  }
}

// @route   POST /api/ai/chat
// @desc    Send message to AI and get response
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get or create conversation history
    const userId = req.user.userId;
    const convId = conversationId || `${userId}-${Date.now()}`;
    
    if (!aiChatHistory.has(convId)) {
      aiChatHistory.set(convId, []);
    }

    const history = aiChatHistory.get(convId);

    // Add user message to history
    history.push({
      role: 'user',
      content: message,
    });

    // Keep only last 10 messages to manage context
    const recentHistory = history.slice(-10);

    // Call OpenRouter AI with failover
    const aiResponse = await callOpenRouterAI([
      {
        role: 'system',
        content: 'You are a helpful assistant for TweekChat, a social media chat application. Be friendly, concise, and helpful.',
      },
      ...recentHistory,
    ]);

    // Add AI response to history
    history.push({
      role: 'assistant',
      content: aiResponse,
    });

    // Update conversation history
    aiChatHistory.set(convId, history);

    // Get a random follow-up question
    const followUpQuestion = aiQuestions[Math.floor(Math.random() * aiQuestions.length)];

    res.json({
      response: aiResponse,
      followUp: followUpQuestion,
      conversationId: convId,
      model: 'OpenRouter AI',
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      message: 'Failed to get AI response. All models are currently unavailable.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/ai/suggestions
// @desc    Get AI-generated conversation starters
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    res.json({
      suggestions: aiQuestions,
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/ai/history/:conversationId
// @desc    Clear AI conversation history
// @access  Private
router.delete('/history/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (aiChatHistory.has(conversationId)) {
      aiChatHistory.delete(conversationId);
      return res.json({ message: 'Conversation history cleared' });
    }
    
    res.status(404).json({ message: 'Conversation not found' });
  } catch (error) {
    console.error('AI history delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
