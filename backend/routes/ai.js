const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Mock AI responses for demonstration
// In production, integrate with OpenAI API or similar
const aiResponses = [
  "That's an interesting question! Let me think about it...",
  "I understand what you're asking. Here's what I think...",
  "Based on what you've shared, I'd suggest...",
  "That's a great point! Have you considered...",
  "I'm here to help! Let me provide some insight on that...",
];

const aiQuestions = [
  "How can I help you today?",
  "What would you like to know more about?",
  "Is there anything else you'd like to discuss?",
  "Would you like me to elaborate on anything?",
];

// Store AI chat history in memory (in production, use database)
const aiChatHistory = new Map();

// @route   POST /api/ai/chat
// @desc    Send message to AI and get response
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message content required' });
    }

    // Get or create user's chat history
    const userId = req.user._id.toString();
    if (!aiChatHistory.has(userId)) {
      aiChatHistory.set(userId, []);
    }

    const userHistory = aiChatHistory.get(userId);

    // Add user message to history
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    userHistory.push(userMessage);

    // Generate AI response
    // In production, call OpenAI API here
    let aiResponse;
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      // TODO: Integrate with OpenAI API
      // const response = await openai.chat.completions.create({
      //   model: "gpt-3.5-turbo",
      //   messages: userHistory.map(msg => ({ role: msg.role, content: msg.content })),
      // });
      // aiResponse = response.choices[0].message.content;
      
      aiResponse = `I received your message: "${message}". ${aiResponses[Math.floor(Math.random() * aiResponses.length)]}`;
    } else {
      // Mock response for development
      const responses = [
        `I understand you're asking about "${message}". That's a fascinating topic!`,
        `Regarding "${message}", here's my perspective...`,
        `You mentioned "${message}". Let me share some thoughts on that.`,
        `That's an interesting point about "${message}". Consider this...`,
      ];
      aiResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Add follow-up question
      const followUp = aiQuestions[Math.floor(Math.random() * aiQuestions.length)];
      aiResponse += ` ${followUp}`;
    }

    // Add AI response to history
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };
    userHistory.push(assistantMessage);

    // Keep only last 50 messages
    if (userHistory.length > 50) {
      userHistory.splice(0, userHistory.length - 50);
    }

    res.json({
      message: aiResponse,
      timestamp: assistantMessage.timestamp
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ message: 'AI service error' });
  }
});

// @route   GET /api/ai/history
// @desc    Get user's AI chat history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const history = aiChatHistory.get(userId) || [];

    res.json({
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Get AI history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/ai/history
// @desc    Clear user's AI chat history
// @access  Private
router.delete('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    aiChatHistory.delete(userId);

    res.json({ message: 'AI chat history cleared' });
  } catch (error) {
    console.error('Clear AI history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ai/suggestions
// @desc    Get suggested questions for AI
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const suggestions = [
      "What are some good conversation starters?",
      "How can I improve my communication skills?",
      "Tell me something interesting about technology",
      "What's the best way to stay productive?",
      "Can you help me brainstorm ideas?",
      "What are the latest trends in social media?",
      "How do I make new friends online?",
      "What makes a good chat application?"
    ];

    // Return random 4 suggestions
    const randomSuggestions = suggestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    res.json({ suggestions: randomSuggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ai/feedback
// @desc    Submit feedback on AI response
// @access  Private
router.post('/feedback', protect, async (req, res) => {
  try {
    const { messageId, rating, comment } = req.body;

    if (!rating || !['positive', 'negative'].includes(rating)) {
      return res.status(400).json({ message: 'Valid rating required (positive/negative)' });
    }

    // In production, store feedback in database
    console.log('AI Feedback:', {
      userId: req.user._id,
      messageId,
      rating,
      comment,
      timestamp: new Date()
    });

    res.json({ message: 'Feedback received. Thank you!' });
  } catch (error) {
    console.error('AI feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
