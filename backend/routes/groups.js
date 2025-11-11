const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// @route   GET /api/groups
// @desc    Get all groups user is part of
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { admin: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate('admin', 'username fullName profilePicture')
      .populate('members', 'username fullName profilePicture')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', 'username fullName profilePicture')
      .populate('members', 'username fullName profilePicture isOnline');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member or admin
    const isMember = group.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );
    const isAdmin = group.admin._id.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    res.json({
      ...group.toObject(),
      isAdmin,
      memberCount: group.members.length
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, groupPicture, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name required' });
    }

    // Validate members exist
    if (members && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } });
      if (validMembers.length !== members.length) {
        return res.status(400).json({ message: 'Some members not found' });
      }
    }

    const group = new Group({
      name,
      description,
      groupPicture,
      admin: req.user._id,
      members: members ? [req.user._id, ...members] : [req.user._id]
    });

    await group.save();
    await group.populate('admin', 'username fullName profilePicture');
    await group.populate('members', 'username fullName profilePicture');

    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update group details
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can update
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can update group' });
    }

    const { name, description, groupPicture } = req.body;

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (groupPicture !== undefined) group.groupPicture = groupPicture;

    await group.save();
    await group.populate('admin', 'username fullName profilePicture');
    await group.populate('members', 'username fullName profilePicture');

    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can delete
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can delete group' });
    }

    await group.deleteOne();
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/groups/:id/members
// @desc    Add members to group
// @access  Private (Admin only)
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs required' });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can add members
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    // Validate users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({ message: 'Some users not found' });
    }

    // Add only new members
    const newMembers = userIds.filter(
      (userId) => !group.members.includes(userId)
    );

    if (newMembers.length === 0) {
      return res.status(400).json({ message: 'All users are already members' });
    }

    group.members.push(...newMembers);
    await group.save();
    await group.populate('members', 'username fullName profilePicture');

    res.json(group);
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove member from group
// @access  Private (Admin only or self)
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = group.admin.toString() === req.user._id.toString();
    const isSelf = req.params.userId === req.user._id.toString();

    // Admin can remove anyone, members can remove themselves
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Cannot remove admin
    if (req.params.userId === group.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove group admin' });
    }

    // Check if user is a member
    if (!group.members.includes(req.params.userId)) {
      return res.status(400).json({ message: 'User is not a member' });
    }

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.params.userId
    );

    await group.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/:id/messages
// @desc    Get group messages
// @access  Private
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember && group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const messages = await Message.find({ group: req.params.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('sender', 'username fullName profilePicture');

    const total = await Message.countDocuments({ group: req.params.id });

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/groups/:id/messages
// @desc    Send message to group
// @access  Private
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const { content, messageType, fileUrl, fileName, fileSize } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content required' });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember && group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const message = new Message({
      sender: req.user._id,
      group: req.params.id,
      content,
      messageType: messageType || 'text',
      fileUrl,
      fileName,
      fileSize
    });

    await message.save();
    await message.populate('sender', 'username fullName profilePicture');

    // Update group's last activity
    group.updatedAt = new Date();
    await group.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
