const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/comments
 * @desc    Create a new comment
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { content, contentType, contentId, parentComment, mentions, hashtags, media } = req.body;

    // Validate content type
    if (!['post', 'reel', 'story'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    // Check if content exists
    let contentModel;
    if (contentType === 'post') contentModel = Post;
    else if (contentType === 'reel') contentModel = Reel;
    // Add Story model check if needed

    const contentExists = await contentModel.findById(contentId);
    if (!contentExists) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // If it's a reply, check if parent comment exists
    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const newComment = new Comment({
      user: req.user.id,
      content,
      contentType,
      contentId,
      parentComment,
      mentions: mentions || [],
      hashtags: hashtags || [],
      media: media || []
    });

    await newComment.save();

    // Populate user details
    await newComment.populate('user', 'username displayName avatar verified');

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/comments/:contentType/:contentId
 * @desc    Get comments for content (post/reel/story)
 * @access  Public
 */
router.get('/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { page = 1, limit = 20, sortBy = 'popular' } = req.query;

    const comments = await Comment.getCommentsForContent(
      contentType,
      contentId,
      { page: parseInt(page), limit: parseInt(limit) },
      sortBy
    );

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/comments/:id/replies
 * @desc    Get replies to a comment
 * @access  Public
 */
router.get('/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const replies = await comment.getReplies(
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json(replies);
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/comments/:id
 * @desc    Edit a comment
 * @access  Private (owner only)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, mentions, hashtags } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if already deleted
    if (comment.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit deleted comment' });
    }

    const updatedComment = await comment.editComment(content, mentions, hashtags);
    await updatedComment.populate('user', 'username displayName avatar verified');

    res.json(updatedComment);
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment (soft delete)
 * @access  Private (owner only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.isDeleted = true;
    comment.content = '[deleted]';
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/comments/:id/like
 * @desc    Toggle like on a comment
 * @access  Private
 */
router.post('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const liked = await comment.toggleLike(req.user.id);
    await comment.populate('user', 'username displayName avatar verified');

    res.json({ 
      comment,
      liked,
      message: liked ? 'Comment liked' : 'Comment unliked'
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/comments/:id/pin
 * @desc    Pin/unpin a comment (content owner only)
 * @access  Private
 */
router.post('/:id/pin', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Get the content to check ownership
    let contentModel;
    if (comment.contentType === 'post') contentModel = Post;
    else if (comment.contentType === 'reel') contentModel = Reel;
    
    const content = await contentModel.findById(comment.contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user owns the content
    if (content.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only content owner can pin comments' });
    }

    // Toggle pin status
    comment.isPinned = !comment.isPinned;
    await comment.save();

    res.json({ 
      comment,
      message: comment.isPinned ? 'Comment pinned' : 'Comment unpinned'
    });
  } catch (error) {
    console.error('Pin comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/comments/user/:userId
 * @desc    Get all comments by a user
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      user: userId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'username displayName avatar verified')
    .populate('contentId', 'caption media');

    const total = await Comment.countDocuments({ 
      user: userId,
      isDeleted: false
    });

    res.json({
      comments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalComments: total
    });
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/comments/:id/translate
 * @desc    Translate comment to specified language
 * @access  Public
 */
router.post('/:id/translate', async (req, res) => {
  try {
    const { id } = req.params;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({ message: 'Language code required' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if translation already exists
    if (comment.translations && comment.translations.has(language)) {
      return res.json({ 
        translatedText: comment.translations.get(language),
        cached: true
      });
    }

    // TODO: Integrate with translation API (Google Translate, DeepL, etc.)
    // For now, return original content
    const translatedText = comment.content; // Replace with actual translation

    // Save translation
    if (!comment.translations) {
      comment.translations = new Map();
    }
    comment.translations.set(language, translatedText);
    await comment.save();

    res.json({ 
      translatedText,
      cached: false
    });
  } catch (error) {
    console.error('Translate comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
