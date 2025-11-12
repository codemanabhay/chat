const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticateToken } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Create post
router.post(
  '/',
  authenticateToken,
  [
    body('type').isIn(['photo', 'video', 'carousel', 'text', 'poll', 'reel']),
    body('caption').optional().isString().trim(),
    body('media').optional().isArray(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = new Post({
        ...req.body,
        user: req.user.userId,
      });

      await post.save();
      await post.populate('user', 'username profilePicture displayName isVerified');

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }
);

// Get feed
router.get('/feed', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const posts = await Post.getFeed(req.user.userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Get explore posts
router.get('/explore', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const posts = await Post.getExplorePosts(req.user.userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Get post by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username profilePicture displayName isVerified')
      .populate('taggedUsers.user', 'username profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.incrementView(req.user.userId);
    res.json(post);
  } catch (error) {
    next(error);
  }
});

// Get user posts
router.get('/user/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const posts = await Post.getUserPosts(req.params.userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Update post
router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isMongoId(),
    body('caption').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.user.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await post.editPost(req.body.caption);
      res.json(post);
    } catch (error) {
      next(error);
    }
  }
);

// Delete post
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Toggle like
router.post('/:id/like', authenticateToken, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.toggleLike(req.user.userId);
    res.json({ likeCount: post.likeCount, isLiked: post.likes.includes(req.user.userId) });
  } catch (error) {
    next(error);
  }
});

// Toggle save
router.post('/:id/save', authenticateToken, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.toggleSave(req.user.userId);
    res.json({ saveCount: post.saveCount, isSaved: post.saves.includes(req.user.userId) });
  } catch (error) {
    next(error);
  }
});

// Get post by hashtag
router.get('/hashtag/:hashtag', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const posts = await Post.getPostsByHashtag(req.params.hashtag, {
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
