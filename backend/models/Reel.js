const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caption: {
      type: String,
      maxlength: 2200,
      trim: true,
    },
    video: {
      url: {
        type: String,
        required: true,
      },
      thumbnail: String,
      publicId: String, // Cloudinary/S3 ID
      mimeType: String,
      duration: {
        type: Number,
        required: true, // in seconds
        min: 3,
        max: 90, // Instagram reels max duration
      },
      width: Number,
      height: Number,
      size: Number, // file size in bytes
      quality: String, // '720p', '1080p', '4k'
      fps: Number, // frames per second
    },
    // Cover/thumbnail customization
    cover: {
      url: String,
      timestamp: Number, // time in video where cover is from
      isCustom: {
        type: Boolean,
        default: false,
      },
    },
    audio: {
      trackId: String,
      trackName: String,
      artist: String,
      url: String,
      startTime: Number, // when audio starts in seconds
      volume: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      isOriginal: {
        type: Boolean,
        default: true,
      },
    },
    // Visual effects and filters
    effects: {
      filter: String, // Instagram filter name
      speed: {
        type: String,
        enum: ['0.3x', '0.5x', '1x', '2x', '3x', '4x'],
        default: '1x',
      },
      transitions: [String],
      stickers: [
        {
          type: String,
          position: {
            x: Number,
            y: Number,
          },
          size: Number,
          rotation: Number,
        },
      ],
    },
    textOverlays: [
      {
        content: String,
        fontFamily: String,
        fontSize: Number,
        color: String,
        backgroundColor: String,
        alignment: String,
        position: {
          x: Number,
          y: Number,
        },
        animation: String,
      },
    ],
    mentions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        username: String,
        position: Number,
      },
    ],
    hashtags: [String],
    location: {
      name: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
      },
      placeId: String,
    },
    taggedUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        position: {
          x: Number,
          y: Number,
        },
      },
    ],
    // Engagement metrics
    views: {
      type: Number,
      default: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewCount: {
          type: Number,
          default: 1,
        },
        lastViewedAt: Date,
      },
    ],
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
    commentCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    saves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    saveCount: {
      type: Number,
      default: 0,
    },
    // Settings
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowDuet: {
      type: Boolean,
      default: true,
    },
    allowRemix: {
      type: Boolean,
      default: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    // Duet/Remix related
    isDuet: {
      type: Boolean,
      default: false,
    },
    isRemix: {
      type: Boolean,
      default: false,
    },
    originalReel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
    },
    // Algorithm/Discovery
    isExploreEligible: {
      type: Boolean,
      default: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    // Moderation
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
reelSchema.index({ user: 1, createdAt: -1 });
reelSchema.index({ 'audio.trackId': 1, createdAt: -1 });
reelSchema.index({ hashtags: 1, createdAt: -1 });
reelSchema.index({ views: -1, createdAt: -1 });
reelSchema.index({ likeCount: -1, createdAt: -1 });
reelSchema.index({ isTrending: -1, engagementRate: -1 });
reelSchema.index({ isExploreEligible: 1, visibility: 1, engagementRate: -1 });

// Method to increment view
reelSchema.methods.incrementView = async function (userId = null) {
  this.views += 1;

  if (userId) {
    const existingView = this.viewedBy.find(
      (v) => v.user.toString() === userId.toString()
    );

    if (existingView) {
      existingView.viewCount += 1;
      existingView.lastViewedAt = new Date();
    } else {
      this.viewedBy.push({
        user: userId,
        viewCount: 1,
        lastViewedAt: new Date(),
      });
      this.uniqueViews += 1;
    }
  }

  await this.save();
  return this;
};

// Method to increment share count
reelSchema.methods.incrementShare = async function () {
  this.shareCount += 1;
  await this.save();
  return this;
};

// Method to calculate engagement rate
reelSchema.methods.calculateEngagementRate = async function () {
  if (this.uniqueViews === 0) {
    this.engagementRate = 0;
  } else {
    const totalEngagements =
      this.likeCount + this.commentCount + this.shareCount + this.saveCount;
    this.engagementRate = (totalEngagements / this.uniqueViews) * 100;
  }
  await this.save();
  return this.engagementRate;
};

// Static method to get trending reels
reelSchema.statics.getTrendingReels = async function (options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({
    isTrending: true,
    visibility: 'public',
    isDeleted: false,
    isArchived: false,
  })
    .sort({ engagementRate: -1, views: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture displayName isVerified')
    .populate('audio.trackId');
};

// Static method to get reels for explore/discovery
reelSchema.statics.getExploreReels = async function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({
    isExploreEligible: true,
    visibility: 'public',
    isDeleted: false,
    isArchived: false,
    user: { $ne: userId }, // Exclude user's own reels
  })
    .sort({ engagementRate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture displayName isVerified');
};

// Static method to get reels by audio
reelSchema.statics.getReelsByAudio = async function (trackId, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({
    'audio.trackId': trackId,
    visibility: 'public',
    isDeleted: false,
  })
    .sort({ views: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture displayName isVerified');
};

// Pre-save middleware
reelSchema.pre('save', function (next) {
  // Update counts
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  if (this.isModified('saves')) {
    this.saveCount = this.saves.length;
  }
  if (this.isModified('viewedBy')) {
    this.uniqueViews = this.viewedBy.length;
  }

  // Extract hashtags from caption
  if (this.isModified('caption') && this.caption) {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(this.caption)) !== null) {
      hashtags.push(match[1]);
    }
    this.hashtags = [...new Set(hashtags)];
  }

  next();
});

module.exports = mongoose.model('Reel', reelSchema);
