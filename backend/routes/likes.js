const express = require('express');
const router = express.Router();
const Like = require('../models/Like');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const Reel = require('../models/Reel');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/likes
 * @desc    Toggle like on content (post/comment/story/reel)
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { contentType, contentId } = req.body;

    // Validate content type
    if (!['post', 'comment', 'story', 'reel'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    // Verify content exists
    let contentModel;
    if (contentType === 'post') contentModel = Post;
    else if (contentType === 'comment') contentModel = Comment;
    else if (contentType === 'story') contentModel = Story;
    else if (contentType === 'reel') contentModel = Reel;

    const content = await contentModel.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const result = await Like.toggleLike(req.user.id, contentType, contentId);

    res.json({
      liked: result.liked,
      likeCount: result.likeCount,
      message: result.liked ? 'Content liked' : 'Like removed'
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/likes/:contentType/:contentId
 * @desc    Get all likes for a piece of content
 * @access  Public
 */
router.get('/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!['post', 'comment', 'story', 'reel'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const likes = await Like.getLikesForContent(contentType, contentId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(likes);
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/likes/user/:userId
 * @desc    Get all content liked by a user
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { contentType, page = 1, limit = 20 } = req.query;

    const query = { user: userId };
    if (contentType && ['post', 'comment', 'story', 'reel'].includes(contentType)) {
      query.contentType = contentType;
    }

    const skip = (page - 1) * limit;

    const likes = await Like.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username displayName avatar verified')
      .populate('contentId');

    const total = await Like.countDocuments(query);

    res.json({
      likes,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalLikes: total
    });
  } catch (error) {
    console.error('Get user likes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/likes/check
 * @desc    Check if user has liked specific content items (batch check)
 * @access  Private
 */
router.post('/check', auth, async (req, res) => {
  try {
    const { items } = req.body; // Array of {contentType, contentId}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array required' });
    }

    if (items.length > 50) {
      return res.status(400).json({ message: 'Maximum 50 items per request' });
    }

    const results = await Like.checkMultipleLikes(req.user.id, items);

    res.json({ results });
  } catch (error) {
    console.error('Check likes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/likes/:contentType/:contentId
 * @desc    Unlike content
 * @access  Private
 */
router.delete('/:contentType/:contentId', auth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params;

    if (!['post', 'comment', 'story', 'reel'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const like = await Like.findOne({
      user: req.user.id,
      contentType,
      contentId
    });

    if (!like) {
      return res.status(404).json({ message: 'Like not found' });
    }

    await like.deleteOne();

    // Update like count on content
    let contentModel;
    if (contentType === 'post') contentModel = Post;
    else if (contentType === 'comment') contentModel = Comment;
    else if (contentType === 'story') contentModel = Story;
    else if (contentType === 'reel') contentModel = Reel;

    await contentModel.findByIdAndUpdate(contentId, {
      $inc: { likesCount: -1 }
    });

    res.json({ message: 'Like removed successfully' });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/likes/stats/:contentType/:contentId
 * @desc    Get detailed like statistics for content
 * @access  Public
 */
router.get('/stats/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params;

    if (!['post', 'comment', 'story', 'reel'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const totalLikes = await Like.countDocuments({ contentType, contentId });

    // Get recent likers (last 10)
    const recentLikes = await Like.find({ contentType, contentId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'username displayName avatar verified');

    // Get likes over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const likesThisWeek = await Like.countDocuments({
      contentType,
      contentId,
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      totalLikes,
      likesThisWeek,
      recentLikers: recentLikes.map(like => like.user)
    });
  } catch (error) {
    console.error('Get like stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/likes/trending
 * @desc    Get trending content based on likes
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { contentType = 'post', timeframe = '24h', limit = 20 } = req.query;

    if (!['post', 'reel', 'story'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type for trending' });
    }

    // Calculate timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch(timeframe) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '6h':
        startDate.setHours(now.getHours() - 6);
        break;
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 1);
    }

    // Aggregate likes to find trending content
    const trending = await Like.aggregate([
      {
        $match: {
          contentType,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$contentId',
          likeCount: { $sum: 1 },
          latestLike: { $max: '$createdAt' }
        }
      },
      {
        $sort: { likeCount: -1, latestLike: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Populate content details
    let contentModel;
    if (contentType === 'post') contentModel = Post;
    else if (contentType === 'reel') contentModel = Reel;
    else if (contentType === 'story') contentModel = Story;

    const contentIds = trending.map(t => t._id);
    const contents = await contentModel.find({ _id: { $in: contentIds } })
      .populate('user', 'username displayName avatar verified');

    // Merge trending data with content
    const result = trending.map(t => {
      const content = contents.find(c => c._id.toString() === t._id.toString());
      return {
        ...content?.toObject(),
        trendingScore: t.likeCount,
        latestLike: t.latestLike
      };
    }).filter(item => item._id); // Remove null entries

    res.json({
      trending: result,
      timeframe,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
