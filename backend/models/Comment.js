const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['post', 'reel', 'story', 'comment'], // comment on comment = reply/nested comment
      required: true,
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'contentModel',
      index: true,
    },
    contentModel: {
      type: String,
      required: true,
      enum: ['Post', 'Reel', 'Story', 'Comment'],
    },
    text: {
      type: String,
      required: true,
      maxlength: 2200, // Instagram's comment limit
      trim: true,
    },
    mentions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        username: String,
        position: Number, // character position in text
      },
    ],
    hashtags: [String],
    // For nested comments/replies
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Nested level tracking (0 = top-level, 1 = first reply, 2 = reply to reply, etc.)
    level: {
      type: Number,
      default: 0,
      max: 5, // Limit nesting depth to prevent deep recursion
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
    replyCount: {
      type: Number,
      default: 0,
    },
    // Media attachment (optional - for comments with images/gifs)
    media: {
      type: {
        type: String,
        enum: ['image', 'gif'],
      },
      url: String,
      thumbnail: String,
      publicId: String,
      width: Number,
      height: Number,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pinnedAt: Date,
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    editHistory: [
      {
        text: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenReason: String, // moderation, spam, etc.
    // Creator/Author specific features
    isCreatorComment: {
      type: Boolean,
      default: false,
    },
    isVerifiedComment: {
      type: Boolean,
      default: false,
    },
    // Translation support
    translation: {
      language: String,
      text: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
commentSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ contentId: 1, isPinned: -1, likeCount: -1 });
commentSchema.index({ isDeleted: 1, isHidden: 1 });

// Virtual for checking if comment has replies
commentSchema.virtual('hasReplies').get(function () {
  return this.replyCount > 0;
});

// Method to toggle like
commentSchema.methods.toggleLike = async function (userId) {
  const likeIndex = this.likes.findIndex(
    (id) => id.toString() === userId.toString()
  );

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

// Method to edit comment
commentSchema.methods.editComment = async function (newText) {
  // Save current text to edit history
  this.editHistory.push({
    text: this.text,
    editedAt: new Date(),
  });

  this.text = newText;
  this.isEdited = true;
  this.editedAt = new Date();

  await this.save();
  return this;
};

// Method to soft delete comment
commentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.text = '[Comment deleted]';
  await this.save();
  return this;
};

// Method to pin comment (only content owner can pin)
commentSchema.methods.pinComment = async function (pinnedByUserId) {
  this.isPinned = true;
  this.pinnedBy = pinnedByUserId;
  this.pinnedAt = new Date();
  await this.save();
  return this;
};

// Method to unpin comment
commentSchema.methods.unpinComment = async function () {
  this.isPinned = false;
  this.pinnedBy = null;
  this.pinnedAt = null;
  await this.save();
  return this;
};

// Method to hide comment (moderation)
commentSchema.methods.hideComment = async function (reason) {
  this.isHidden = true;
  this.hiddenReason = reason;
  await this.save();
  return this;
};

// Static method to get comments for a post/reel/story
commentSchema.statics.getCommentsForContent = async function (
  contentType,
  contentId,
  options = {}
) {
  const {
    limit = 20,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = -1,
    includeDeleted = false,
  } = options;

  const query = {
    contentType,
    contentId,
    parentComment: null, // Only top-level comments
  };

  if (!includeDeleted) {
    query.isDeleted = false;
    query.isHidden = false;
  }

  return this.find(query)
    .sort({ isPinned: -1, [sortBy]: sortOrder }) // Pinned comments first
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture displayName isVerified')
    .populate('replyTo', 'username');
};

// Static method to get replies for a comment
commentSchema.statics.getRepliesForComment = async function (
  parentCommentId,
  options = {}
) {
  const { limit = 10, skip = 0, includeDeleted = false } = options;

  const query = {
    parentComment: parentCommentId,
  };

  if (!includeDeleted) {
    query.isDeleted = false;
    query.isHidden = false;
  }

  return this.find(query)
    .sort({ createdAt: 1 }) // Replies in chronological order
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture displayName isVerified')
    .populate('replyTo', 'username');
};

// Static method to get comment count for content
commentSchema.statics.getCommentCount = async function (contentType, contentId) {
  return this.countDocuments({
    contentType,
    contentId,
    isDeleted: false,
    isHidden: false,
  });
};

// Pre-save middleware to update counts and extract metadata
commentSchema.pre('save', function (next) {
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }

  // Extract mentions from text
  if (this.isModified('text')) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(this.text)) !== null) {
      mentions.push({
        username: match[1],
        position: match.index,
      });
    }
    // Note: User IDs would need to be resolved separately
  }

  // Extract hashtags from text
  if (this.isModified('text')) {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(this.text)) !== null) {
      hashtags.push(match[1]);
    }
    this.hashtags = [...new Set(hashtags)]; // Remove duplicates
  }

  next();
});

// Post-save middleware to update parent comment reply count
commentSchema.post('save', async function (doc) {
  if (doc.parentComment) {
    // Update parent comment's reply count
    await this.constructor.updateOne(
      { _id: doc.parentComment },
      {
        $inc: { replyCount: 1 },
      }
    );
  }

  // Update content's comment count (would need to be handled in Post/Reel/Story models)
});

// Post-delete middleware to update parent comment reply count
commentSchema.post('findOneAndDelete', async function (doc) {
  if (doc && doc.parentComment) {
    await this.model.updateOne(
      { _id: doc.parentComment },
      {
        $inc: { replyCount: -1 },
      }
    );
  }
});

module.exports = mongoose.model('Comment', commentSchema);
