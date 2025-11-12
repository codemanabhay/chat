const express = require('express');
const router = express.Router();
const Reel = require('../models/Reel');
const Like = require('../models/Like');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/reels
 * @desc    Create a new reel
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      videoUrl,
      thumbnailUrl,
      caption,
      duration,
      effects,
      filters,
      speed,
      textOverlays,
      stickers,
      transitions,
      audio,
      hashtags,
      mentions,
      location,
      allowComments,
      allowDuet,
      allowRemix
    } = req.body;

    // Validate duration (3-90 seconds)
    if (duration < 3 || duration > 90) {
      return res.status(400).json({ message: 'Duration must be between 3 and 90 seconds' });
    }

    const newReel = new Reel({
      user: req.user.id,
      videoUrl,
      thumbnailUrl,
      caption: caption || '',
      duration,
      effects: effects || [],
      filters: filters || [],
      speed: speed || 1.0,
      textOverlays: textOverlays || [],
      stickers: stickers || [],
      transitions: transitions || [],
      audio: audio || {},
      hashtags: hashtags || [],
      mentions: mentions || [],
      location: location || {},
      allowComments: allowComments !== false,
      allowDuet: allowDuet !== false,
      allowRemix: allowRemix !== false
    });

    await newReel.save();
    await newReel.populate('user', 'username displayName avatar verified');

    res.status(201).json(newReel);
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reels/feed
 * @desc    Get personalized reel feed
 * @access  Private
 */
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get reels from followed users and trending reels
    const reels = await Reel.find({
      $or: [
        { user: { $in: req.user.following } },
        { isTrending: true }
      ]
    })
    .sort({ createdAt: -1, viewsCount: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'username displayName avatar verified')
    .populate('audio.user', 'username displayName');

    res.json({
      reels,
      currentPage: parseInt(page),
      hasMore: reels.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reels/explore
 * @desc    Get explore page reels (trending)
 * @access  Public
 */
router.get('/explore', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reels = await Reel.getTrendingReels({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(reels);
  } catch (error) {
    console.error('Get explore reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reels/for-you
 * @desc    Get personalized "For You" page reels
 * @access  Private
 */
router.get('/for-you', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reels = await Reel.getExploreReels(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(reels);
  } catch (error) {
    console.error('Get for-you reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reels/:id
 * @desc    Get specific reel and increment view
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const reel = await Reel.findById(id)
      .populate('user', 'username displayName avatar verified bio followersCount')
      .populate('audio.user', 'username displayName avatar');

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Increment view count
    await reel.incrementView();

    res.json(reel);
  } catch (error) {
    console.error('Get reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reels/user/:userId
 * @desc    Get all reels by a user
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const reels = await Reel.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username displayName avatar verified');

    const total = await Reel.countDocuments({ user: userId });

    res.json({
      reels,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalReels: total
    });
  } catch (error) {
    console.error('Get user reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reels/audio/:audioId
 * @desc    Get all reels using specific audio
 * @access  Public
 */
router.get('/audio/:audioId', async (req, res) => {
  try {
    const { audioId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const reels = await Reel.getReelsByAudio(audioId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(reels);
  } catch (error) {
    console.error('Get reels by audio error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/reels/:id
 * @desc    Update a reel
 * @access  Private (owner only)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, hashtags, mentions, location, allowComments, allowDuet, allowRemix } = req.body;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Check ownership
    if (reel.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update fields
    if (caption !== undefined) reel.caption = caption;
    if (hashtags !== undefined) reel.hashtags = hashtags;
    if (mentions !== undefined) reel.mentions = mentions;
    if (location !== undefined) reel.location = location;
    if (allowComments !== undefined) reel.allowComments = allowComments;
    if (allowDuet !== undefined) reel.allowDuet = allowDuet;
    if (allowRemix !== undefined) reel.allowRemix = allowRemix;

    await reel.save();
    await reel.populate('user', 'username displayName avatar verified');

    res.json(reel);
  } catch (error) {
    console.error('Update reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/reels/:id
 * @desc    Delete a reel
 * @access  Private (owner only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    // Check ownership
    if (reel.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await reel.deleteOne();

    // TODO: Delete associated likes, comments, saves
    await Like.deleteMany({ contentType: 'reel', contentId: id });

    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/reels/:id/like
 * @desc    Toggle like on a reel
 * @access  Private
 */
router.post('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const result = await Like.toggleLike(req.user.id, 'reel', id);

    res.json({
      liked: result.liked,
      likeCount: result.likeCount,
      message: result.liked ? 'Reel liked' : 'Like removed'
    });
  } catch (error) {
    console.error('Like reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/reels/:id/share
 * @desc    Increment share count
 * @access  Private
 */
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.sharesCount += 1;
    await reel.save();

    res.json({ message: 'Share counted', sharesCount: reel.sharesCount });
  } catch (error) {
    console.error('Share reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reels/hashtag/:hashtag
 * @desc    Get reels by hashtag
 * @access  Public
 */
router.get('/hashtag/:hashtag', async (req, res) => {
  try {
    const { hashtag } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const reels = await Reel.find({
      hashtags: { $regex: new RegExp(`^${hashtag}$`, 'i') }
    })
    .sort({ createdAt: -1, viewsCount: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'username displayName avatar verified');

    const total = await Reel.countDocuments({
      hashtags: { $regex: new RegExp(`^${hashtag}$`, 'i') }
    });

    res.json({
      reels,
      hashtag,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalReels: total
    });
  } catch (error) {
    console.error('Get hashtag reels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
