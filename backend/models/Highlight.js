const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    coverImage: {
      url: String,
      storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
      },
    },
    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
      },
    ],
    storyCount: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

highlightSchema.index({ user: 1, order: 1 });
highlightSchema.index({ user: 1, isArchived: 1 });

highlightSchema.pre('save', function (next) {
  if (this.isModified('stories')) {
    this.storyCount = this.stories.length;
  }
  next();
});

module.exports = mongoose.model('Highlight', highlightSchema);
