const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['post', 'comment', 'story', 'reel'],
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
      enum: ['Post', 'Comment', 'Story', 'Reel'],
    },
    // Content owner (for notifications)
    contentOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional: Track if notification was sent
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
likeSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true }); // Prevent duplicate likes
likeSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });
likeSchema.index({ contentOwner: 1, createdAt: -1 });
likeSchema.index({ user: 1, createdAt: -1 });

// Static method to add a like (handles duplicate prevention)
likeSchema.statics.addLike = async function (
  userId,
  contentType,
  contentId,
  contentModel,
  contentOwnerId
) {
  try {
    const like = await this.create({
      user: userId,
      contentType,
      contentId,
      contentModel,
      contentOwner: contentOwnerId,
    });

    // Update like count on the content (handled in post-save middleware)
    return { success: true, like, action: 'liked' };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - like already exists
      return { success: false, error: 'Already liked', action: 'none' };
    }
    throw error;
  }
};

// Static method to remove a like
likeSchema.statics.removeLike = async function (
  userId,
  contentType,
  contentId
) {
  const like = await this.findOneAndDelete({
    user: userId,
    contentType,
    contentId,
  });

  if (!like) {
    return { success: false, error: 'Like not found', action: 'none' };
  }

  // Update like count on the content (handled in post-delete middleware)
  return { success: true, like, action: 'unliked' };
};

// Static method to toggle like (like if not liked, unlike if already liked)
likeSchema.statics.toggleLike = async function (
  userId,
  contentType,
  contentId,
  contentModel,
  contentOwnerId
) {
  const existingLike = await this.findOne({
    user: userId,
    contentType,
    contentId,
  });

  if (existingLike) {
    // Unlike
    await existingLike.deleteOne();
    return { success: true, action: 'unliked', like: null };
  } else {
    // Like
    const result = await this.addLike(
      userId,
      contentType,
      contentId,
      contentModel,
      contentOwnerId
    );
    return result;
  }
};

// Static method to check if user liked content
likeSchema.statics.hasUserLiked = async function (
  userId,
  contentType,
  contentId
) {
  const like = await this.findOne({
    user: userId,
    contentType,
    contentId,
  });
  return !!like;
};

// Static method to get likes for content
likeSchema.statics.getLikesForContent = async function (
  contentType,
  contentId,
  options = {}
) {
  const { limit = 20, skip = 0 } = options;

  return this.find({
    contentType,
    contentId,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture displayName isVerified');
};

// Static method to get like count for content
likeSchema.statics.getLikeCount = async function (contentType, contentId) {
  return this.countDocuments({
    contentType,
    contentId,
  });
};

// Static method to get all likes by a user
likeSchema.statics.getLikesByUser = async function (userId, options = {}) {
  const { limit = 50, skip = 0, contentType = null } = options;

  const query = { user: userId };
  if (contentType) {
    query.contentType = contentType;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('contentId')
    .populate('contentOwner', 'username profilePicture');
};

// Static method to get users who liked content owned by a specific user (for notifications)
likeSchema.statics.getLikesReceivedByUser = async function (
  userId,
  options = {}
) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;

  const query = {
    contentOwner: userId,
    user: { $ne: userId }, // Exclude self-likes
  };

  if (unreadOnly) {
    query.notificationSent = false;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture displayName isVerified')
    .populate('contentId');
};

// Static method to batch check if user liked multiple contents
likeSchema.statics.batchCheckUserLikes = async function (userId, contentIds) {
  const likes = await this.find({
    user: userId,
    contentId: { $in: contentIds },
  }).select('contentId');

  const likedContentIds = new Set(
    likes.map((like) => like.contentId.toString())
  );

  return contentIds.reduce((acc, contentId) => {
    acc[contentId.toString()] = likedContentIds.has(contentId.toString());
    return acc;
  }, {});
};

// Post-save middleware to update content's like count
likeSchema.post('save', async function (doc) {
  const Model = mongoose.model(doc.contentModel);
  
  try {
    await Model.updateOne(
      { _id: doc.contentId },
      {
        $addToSet: { likes: doc.user },
        $inc: { likeCount: 1 },
      }
    );
  } catch (error) {
    console.error('Error updating like count on save:', error);
  }

  // TODO: Create notification for content owner (if not self-like)
  if (doc.user.toString() !== doc.contentOwner.toString()) {
    // Create notification logic here
  }
});

// Post-delete middleware to update content's like count
likeSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;

  const Model = mongoose.model(doc.contentModel);
  
  try {
    await Model.updateOne(
      { _id: doc.contentId },
      {
        $pull: { likes: doc.user },
        $inc: { likeCount: -1 },
      }
    );
  } catch (error) {
    console.error('Error updating like count on delete:', error);
  }
});

// Post-deleteOne middleware
likeSchema.post('deleteOne', { document: true, query: false }, async function () {
  const doc = this;
  const Model = mongoose.model(doc.contentModel);
  
  try {
    await Model.updateOne(
      { _id: doc.contentId },
      {
        $pull: { likes: doc.user },
        $inc: { likeCount: -1 },
      }
    );
  } catch (error) {
    console.error('Error updating like count on deleteOne:', error);
  }
});

module.exports = mongoose.model('Like', likeSchema);
