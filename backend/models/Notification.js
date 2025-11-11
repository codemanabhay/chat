const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['follow', 'message', 'group_invite', 'group_message', 'mention', 'like', 'comment'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = await this.create(data);
    return notification.populate('sender', 'username fullName profilePicture');
  } catch (error) {
    throw error;
  }
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationIds, userId) {
  try {
    return await this.updateMany(
      { _id: { $in: notificationIds }, recipient: userId },
      { isRead: true }
    );
  } catch (error) {
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    return await this.countDocuments({ recipient: userId, isRead: false });
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('Notification', notificationSchema);
