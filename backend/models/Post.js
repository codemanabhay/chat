const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['photo', 'video', 'carousel', 'text', 'poll', 'reel'],
    required: true
  },
  caption: {
    type: String,
    maxlength: 2200,
    trim: true
  },
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnail: String,
    dimensions: {
      width: Number,
      height: Number
    },
    duration: Number, // For videos
    size: Number
  }],
  location: {
    name: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },
    place_id: String
  },
  tagged_users: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    position: {
      x: { type: Number, min: 0, max: 100 },
      y: { type: Number, min: 0, max: 100 }
    }
  }],
  hashtags: [{ type: String, trim: true, lowercase: true }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes_count: { type: Number, default: 0, min: 0 },
  comments_count: { type: Number, default: 0, min: 0 },
  shares_count: { type: Number, default: 0, min: 0 },
  saves_count: { type: Number, default: 0, min: 0 },
  views_count: { type: Number, default: 0, min: 0 },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private', 'close_friends'],
    default: 'public'
  },
  comments_disabled: { type: Boolean, default: false },
  likes_hidden: { type: Boolean, default: false },
  is_archived: { type: Boolean, default: false },
  is_pinned: { type: Boolean, default: false },
  music: {
    title: String,
    artist: String,
    url: String,
    duration: Number
  },
  filters: String,
  edit_history: [{
    caption: String,
    edited_at: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes_count: -1 });

// Virtual for likes
postSchema.virtual('liked_by', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'post'
});

// Methods
postSchema.methods.incrementViews = function() {
  this.views_count += 1;
  return this.save();
};

postSchema.methods.updateCounts = async function() {
  const Like = mongoose.model('Like');
  const Comment = mongoose.model('Comment');
  
  this.likes_count = await Like.countDocuments({ post: this._id, type: 'post' });
  this.comments_count = await Comment.countDocuments({ post: this._id });
  return this.save();
};

// Statics
postSchema.statics.getFeed = async function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({
    author: { $in: options.following || [] },
    is_archived: false
  })
  .populate('author', 'username fullName profilePicture')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

module.exports = mongoose.model('Post', postSchema);
