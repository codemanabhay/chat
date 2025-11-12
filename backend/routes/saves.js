const express = require('express');
const router = express.Router();
const Save = require('../models/Save');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/saves
 * @desc    Toggle save on content (post/reel)
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { contentType, contentId, collectionName, note, tags } = req.body;

    // Validate content type
    if (!['post', 'reel'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    // Verify content exists
    let contentModel;
    if (contentType === 'post') contentModel = Post;
    else if (contentType === 'reel') contentModel = Reel;

    const content = await contentModel.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if already saved
    const existingSave = await Save.findOne({
      user: req.user.id,
      contentType,
      contentId
    });

    if (existingSave) {
      return res.status(400).json({ 
        message: 'Already saved',
        save: existingSave
      });
    }

    const newSave = new Save({
      user: req.user.id,
      contentType,
      contentId,
      collectionName: collectionName || 'All Posts',
      note: note || '',
      tags: tags || []
    });

    await newSave.save();
    await newSave.populate('contentId');

    res.status(201).json({
      message: 'Content saved',
      save: newSave
    });
  } catch (error) {
    console.error('Save content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/saves
 * @desc    Get all saved content by user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { contentType, collectionName, page = 1, limit = 20 } = req.query;

    const query = { user: req.user.id };
    if (contentType) query.contentType = contentType;
    if (collectionName) query.collectionName = collectionName;

    const skip = (page - 1) * limit;

    const saves = await Save.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('contentId')
      .populate('user', 'username displayName avatar');

    const total = await Save.countDocuments(query);

    res.json({
      saves,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalSaves: total
    });
  } catch (error) {
    console.error('Get saves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/saves/collections
 * @desc    Get all collections with save counts
 * @access  Private
 */
router.get('/collections', auth, async (req, res) => {
  try {
    const collections = await Save.aggregate([
      { $match: { user: req.user._id } },
      { 
        $group: {
          _id: '$collectionName',
          count: { $sum: 1 },
          lastUpdated: { $max: '$createdAt' }
        }
      },
      { $sort: { lastUpdated: -1 } }
    ]);

    res.json({ collections });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/saves/:id
 * @desc    Get specific saved item
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const save = await Save.findById(id)
      .populate('contentId')
      .populate('user', 'username displayName avatar');

    if (!save) {
      return res.status(404).json({ message: 'Save not found' });
    }

    // Check ownership
    if (save.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Increment view count
    save.viewsCount += 1;
    await save.save();

    res.json(save);
  } catch (error) {
    console.error('Get save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/saves/:id
 * @desc    Update save (move to collection, add note/tags, toggle favorite)
 * @access  Private (owner only)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { collectionName, note, tags, isFavorite } = req.body;

    const save = await Save.findById(id);
    if (!save) {
      return res.status(404).json({ message: 'Save not found' });
    }

    // Check ownership
    if (save.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update fields
    if (collectionName !== undefined) save.collectionName = collectionName;
    if (note !== undefined) save.note = note;
    if (tags !== undefined) save.tags = tags;
    if (isFavorite !== undefined) save.isFavorite = isFavorite;

    await save.save();
    await save.populate('contentId');

    res.json(save);
  } catch (error) {
    console.error('Update save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/saves/:id
 * @desc    Unsave/remove saved content
 * @access  Private (owner only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const save = await Save.findById(id);
    if (!save) {
      return res.status(404).json({ message: 'Save not found' });
    }

    // Check ownership
    if (save.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await save.deleteOne();

    // Update save count on content
    let contentModel;
    if (save.contentType === 'post') contentModel = Post;
    else if (save.contentType === 'reel') contentModel = Reel;

    await contentModel.findByIdAndUpdate(save.contentId, {
      $inc: { savesCount: -1 }
    });

    res.json({ message: 'Save removed successfully' });
  } catch (error) {
    console.error('Delete save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/saves/:contentType/:contentId
 * @desc    Unsave content by type and ID
 * @access  Private
 */
router.delete('/:contentType/:contentId', auth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params;

    if (!['post', 'reel'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const save = await Save.findOne({
      user: req.user.id,
      contentType,
      contentId
    });

    if (!save) {
      return res.status(404).json({ message: 'Save not found' });
    }

    await save.deleteOne();

    // Update save count
    let contentModel;
    if (contentType === 'post') contentModel = Post;
    else if (contentType === 'reel') contentModel = Reel;

    await contentModel.findByIdAndUpdate(contentId, {
      $inc: { savesCount: -1 }
    });

    res.json({ message: 'Save removed successfully' });
  } catch (error) {
    console.error('Delete save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/saves/check
 * @desc    Check if content is saved (batch check)
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

    const results = await Save.checkMultipleSaves(req.user.id, items);

    res.json({ results });
  } catch (error) {
    console.error('Check saves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/saves/:id/move
 * @desc    Move save to different collection
 * @access  Private (owner only)
 */
router.post('/:id/move', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { collectionName } = req.body;

    if (!collectionName) {
      return res.status(400).json({ message: 'Collection name required' });
    }

    const save = await Save.findById(id);
    if (!save) {
      return res.status(404).json({ message: 'Save not found' });
    }

    // Check ownership
    if (save.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await save.moveToCollection(collectionName);
    await save.populate('contentId');

    res.json({
      message: `Moved to ${collectionName}`,
      save
    });
  } catch (error) {
    console.error('Move save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/saves/favorites
 * @desc    Get all favorite saves
 * @access  Private
 */
router.get('/favorites', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const saves = await Save.find({
      user: req.user.id,
      isFavorite: true
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('contentId')
    .populate('user', 'username displayName avatar');

    const total = await Save.countDocuments({
      user: req.user.id,
      isFavorite: true
    });

    res.json({
      saves,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalFavorites: total
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
