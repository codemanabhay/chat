const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users with pagination and search
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select('-password -email')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search/:query
// @desc    Search users by username or name
// @access  Private
router.get('/search/:query', protect, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query too short' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
    })
      .select('username fullName profilePicture bio followers following')
      .limit(parseInt(limit));

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/suggestions
// @desc    Get user suggestions (users not followed)
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const currentUser = await User.findById(req.user._id);

    const suggestions = await User.find({
      _id: { $nin: [...currentUser.following, req.user._id] },
    })
      .select('username fullName profilePicture bio followers')
      .limit(parseInt(limit))
      .sort({ followers: -1 });

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID with profile details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user follows this user
    const isFollowing = user.followers.some(
      (follower) => follower._id.toString() === req.user._id.toString()
    );

    res.json({
      ...user.toObject(),
      isFollowing,
      isOwnProfile: req.user._id.toString() === user._id.toString(),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    // Only allow users to update their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { fullName, bio, profilePicture, website } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (website !== undefined) updateData.website = website;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following and followers
    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user._id);

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: 'User followed successfully', user: userToFollow });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id/unfollow
// @desc    Unfollow a user
// @access  Private
router.delete('/:id/unfollow', protect, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot unfollow yourself' });
    }

    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if actually following
    if (!currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/followers
// @desc    Get user's followers
// @access  Private
router.get('/:id/followers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'followers',
      'username fullName profilePicture bio'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.followers);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/following
// @desc    Get users that this user follows
// @access  Private
router.get('/:id/following', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'following',
      'username fullName profilePicture bio'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.following);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
