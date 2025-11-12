const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const { authenticateToken } = require('../middleware/auth');

// Create story
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const story = new Story({ ...req.body, user: req.user.userId });
    await story.save();
    await story.populate('user', 'username profilePicture displayName');
    res.status(201).json(story);
  } catch (error) {
    next(error);
  }
});

// Get following stories
router.get('/following', authenticateToken, async (req, res, next) => {
  try {
    const { followingIds } = req.body; // Pass following user IDs
    const stories = await Story.getFollowingStories(req.user.userId, followingIds || []);
    res.json(stories);
  } catch (error) {
    next(error);
  }
});

// Get user stories
router.get('/user/:userId', authenticateToken, async (req, res, next) => {
  try {
    const stories = await Story.getActiveStoriesByUser(req.params.userId);
    res.json(stories);
  } catch (error) {
    next(error);
  }
});

// Get story by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id).populate('user', 'username profilePicture displayName');
    if (!story || story.isExpired) {
      return res.status(404).json({ message: 'Story not found or expired' });
    }
    await story.addViewer(req.user.userId);
    res.json(story);
  } catch (error) {
    next(error);
  }
});

// Like story
router.post('/:id/like', authenticateToken, async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    await story.toggleLike(req.user.userId);
    res.json({ likeCount: story.likeCount });
  } catch (error) {
    next(error);
  }
});

// Reply to story
router.post('/:id/reply', authenticateToken, async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    await story.addReply(req.user.userId, req.body.message);
    res.json({ replyCount: story.replyCount });
  } catch (error) {
    next(error);
  }
});

// Delete story
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (story.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await story.deleteOne();
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
