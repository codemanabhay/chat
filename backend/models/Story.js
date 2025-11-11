const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['photo', 'video', 'boomerang', 'superzoom', 'rewind', 'hands_free'],
      default: 'photo',
    },
    media: {
      url: {
        type: String,
        required: true,
      },
      thumbnail: String,
      publicId: String, // Cloudinary/S3 ID for deletion
      mimeType: String,
      duration: Number, // for videos in seconds
      width: Number,
      height: Number,
      size: Number, // file size in bytes
    },
    textOverlay: {
      content: String,
      fontFamily: String,
      fontSize: Number,
      color: String,
      backgroundColor: String,
      alignment: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'center',
      },
      position: {
        x: Number,
        y: Number,
      },
    },
    stickers: [
      {
        type: {
          type: String,
          enum: [
            'emoji',
            'gif',
            'mention',
            'location',
            'hashtag',
            'poll',
            'question',
            'countdown',
            'quiz',
            'slider',
            'link',
            'music',
          ],
        },
        content: mongoose.Schema.Types.Mixed, // flexible data for different sticker types
        position: {
          x: Number,
          y: Number,
        },
        size: Number,
        rotation: Number,
      },
    ],
    music: {
      trackId: String,
      trackName: String,
      artist: String,
      startTime: Number, // in seconds
      duration: Number,
    },
    filter: String, // Instagram filter name
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    viewerCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replyCount: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'close_friends', 'custom'],
      default: 'followers',
    },
    allowedViewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ], // for custom visibility
    closeFriendsList: {
      type: Boolean,
      default: false,
    },
    hideViewers: {
      type: Boolean,
      default: false,
    },
    allowReplies: {
      type: Boolean,
      default: true,
    },
    allowSharing: {
      type: Boolean,
      default: true,
    },
    highlight: {
      isHighlight: {
        type: Boolean,
        default: false,
      },
      highlightId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Highlight',
      },
      addedToHighlightAt: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: true,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to auto-delete expired stories (only if not highlight and not archived)
storySchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      'highlight.isHighlight': false,
      isArchived: false,
    },
  }
);

// Compound indexes for efficient queries
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1, isExpired: 1 });
storySchema.index({ 'highlight.isHighlight': 1, user: 1 });

// Virtual for checking if story is still active
storySchema.virtual('isActive').get(function () {
  return !this.isExpired && new Date() < this.expiresAt;
});

// Method to add a viewer
storySchema.methods.addViewer = async function (userId) {
  // Check if user already viewed
  const alreadyViewed = this.viewers.some(
    (viewer) => viewer.user.toString() === userId.toString()
  );

  if (!alreadyViewed) {
    this.viewers.push({ user: userId, viewedAt: new Date() });
    this.viewerCount = this.viewers.length;
    await this.save();
  }

  return this;
};

// Method to add a reply
storySchema.methods.addReply = async function (userId, message) {
  if (!this.allowReplies) {
    throw new Error('Replies are not allowed on this story');
  }

  this.replies.push({
    user: userId,
    message,
    createdAt: new Date(),
  });
  this.replyCount = this.replies.length;
  await this.save();

  return this;
};

// Method to toggle like
storySchema.methods.toggleLike = async function (userId) {
  const likeIndex = this.likes.indexOf(userId);

  if (likeIndex > -1) {
    // Unlike
    this.likes.splice(likeIndex, 1);
  } else {
    // Like
    this.likes.push(userId);
  }

  this.likeCount = this.likes.length;
  await this.save();

  return this;
};

// Method to check if story should be expired
storySchema.methods.checkExpiration = async function () {
  if (!this.isExpired && new Date() >= this.expiresAt) {
    this.isExpired = true;
    await this.save();
  }
  return this.isExpired;
};

// Method to add story to highlights (prevents auto-deletion)
storySchema.methods.addToHighlight = async function (highlightId) {
  this.highlight.isHighlight = true;
  this.highlight.highlightId = highlightId;
  this.highlight.addedToHighlightAt = new Date();
  await this.save();
  return this;
};

// Static method to get active stories for a user
storySchema.statics.getActiveStoriesByUser = async function (userId) {
  return this.find({
    user: userId,
    isExpired: false,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePicture displayName');
};

// Static method to get stories from users that current user follows
storySchema.statics.getFollowingStories = async function (
  userId,
  followingIds
) {
  return this.find({
    user: { $in: followingIds },
    isExpired: false,
    expiresAt: { $gt: new Date() },
    $or: [
      { visibility: 'public' },
      { visibility: 'followers' },
      {
        visibility: 'close_friends',
        closeFriendsList: true,
        allowedViewers: userId,
      },
      { visibility: 'custom', allowedViewers: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePicture displayName')
    .limit(100);
};

// Static method to mark expired stories
storySchema.statics.markExpiredStories = async function () {
  const now = new Date();
  const result = await this.updateMany(
    {
      expiresAt: { $lte: now },
      isExpired: false,
      'highlight.isHighlight': false,
    },
    {
      $set: { isExpired: true },
    }
  );
  return result;
};

// Pre-save middleware to ensure counts are accurate
storySchema.pre('save', function (next) {
  if (this.isModified('viewers')) {
    this.viewerCount = this.viewers.length;
  }
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  if (this.isModified('replies')) {
    this.replyCount = this.replies.length;
  }
  next();
});

module.exports = mongoose.model('Story', storySchema);
