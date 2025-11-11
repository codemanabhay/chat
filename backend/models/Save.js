const mongoose = require('mongoose');

const saveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['post', 'reel'],
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
      enum: ['Post', 'Reel'],
    },
    // Collections for organizing saved content (like Instagram collections)
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SaveCollection',
      default: null,
      index: true,
    },
    // Notes that user can add to saved items
    note: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    // Tags for personal organization
    tags: [String],
    // Priority or favorite marking within saves
    isFavorite: {
      type: Boolean,
      default: false,
    },
    // Track when user last viewed this saved item
    lastViewed: Date,
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
saveSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true }); // Prevent duplicate saves
saveSchema.index({ user: 1, collection: 1, createdAt: -1 });
saveSchema.index({ user: 1, isFavorite: -1, createdAt: -1 });
saveSchema.index({ user: 1, contentType: 1, createdAt: -1 });

// Static method to save content (handles duplicate prevention)
saveSchema.statics.saveContent = async function (
  userId,
  contentType,
  contentId,
  contentModel,
  options = {}
) {
  const { collectionId = null, note = null, tags = [] } = options;

  try {
    const save = await this.create({
      user: userId,
      contentType,
      contentId,
      contentModel,
      collection: collectionId,
      note,
      tags,
    });

    // Update save count on the content (handled in post-save middleware)
    return { success: true, save, action: 'saved' };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - already saved
      return { success: false, error: 'Already saved', action: 'none' };
    }
    throw error;
  }
};

// Static method to unsave content
saveSchema.statics.unsaveContent = async function (
  userId,
  contentType,
  contentId
) {
  const save = await this.findOneAndDelete({
    user: userId,
    contentType,
    contentId,
  });

  if (!save) {
    return { success: false, error: 'Save not found', action: 'none' };
  }

  // Update save count on the content (handled in post-delete middleware)
  return { success: true, save, action: 'unsaved' };
};

// Static method to toggle save
saveSchema.statics.toggleSave = async function (
  userId,
  contentType,
  contentId,
  contentModel,
  options = {}
) {
  const existingSave = await this.findOne({
    user: userId,
    contentType,
    contentId,
  });

  if (existingSave) {
    // Unsave
    await existingSave.deleteOne();
    return { success: true, action: 'unsaved', save: null };
  } else {
    // Save
    const result = await this.saveContent(
      userId,
      contentType,
      contentId,
      contentModel,
      options
    );
    return result;
  }
};

// Static method to check if user saved content
saveSchema.statics.hasUserSaved = async function (
  userId,
  contentType,
  contentId
) {
  const save = await this.findOne({
    user: userId,
    contentType,
    contentId,
  });
  return !!save;
};

// Static method to get saved content for user
saveSchema.statics.getSavedByUser = async function (userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    contentType = null,
    collectionId = null,
    favoritesOnly = false,
    sortBy = 'createdAt',
    sortOrder = -1,
  } = options;

  const query = { user: userId };
  
  if (contentType) {
    query.contentType = contentType;
  }
  
  if (collectionId) {
    query.collection = collectionId;
  } else if (collectionId === null && options.hasOwnProperty('collectionId')) {
    // Explicitly looking for items not in any collection
    query.collection = null;
  }
  
  if (favoritesOnly) {
    query.isFavorite = true;
  }

  return this.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .populate('contentId')
    .populate('collection', 'name coverImage');
};

// Static method to move saved item to a collection
saveSchema.statics.moveToCollection = async function (
  userId,
  contentType,
  contentId,
  collectionId
) {
  const save = await this.findOneAndUpdate(
    {
      user: userId,
      contentType,
      contentId,
    },
    {
      collection: collectionId,
    },
    { new: true }
  );

  if (!save) {
    return { success: false, error: 'Save not found' };
  }

  return { success: true, save };
};

// Static method to add note to saved item
saveSchema.statics.addNote = async function (
  userId,
  contentType,
  contentId,
  note
) {
  const save = await this.findOneAndUpdate(
    {
      user: userId,
      contentType,
      contentId,
    },
    {
      note,
    },
    { new: true }
  );

  if (!save) {
    return { success: false, error: 'Save not found' };
  }

  return { success: true, save };
};

// Static method to toggle favorite
saveSchema.statics.toggleFavorite = async function (
  userId,
  contentType,
  contentId
) {
  const save = await this.findOne({
    user: userId,
    contentType,
    contentId,
  });

  if (!save) {
    return { success: false, error: 'Save not found' };
  }

  save.isFavorite = !save.isFavorite;
  await save.save();

  return { success: true, save, isFavorite: save.isFavorite };
};

// Static method to get save count for content
saveSchema.statics.getSaveCount = async function (contentType, contentId) {
  return this.countDocuments({
    contentType,
    contentId,
  });
};

// Static method to batch check if user saved multiple contents
saveSchema.statics.batchCheckUserSaves = async function (userId, contentIds) {
  const saves = await this.find({
    user: userId,
    contentId: { $in: contentIds },
  }).select('contentId');

  const savedContentIds = new Set(
    saves.map((save) => save.contentId.toString())
  );

  return contentIds.reduce((acc, contentId) => {
    acc[contentId.toString()] = savedContentIds.has(contentId.toString());
    return acc;
  }, {});
};

// Method to increment view count
saveSchema.methods.incrementView = async function () {
  this.viewCount += 1;
  this.lastViewed = new Date();
  await this.save();
  return this;
};

// Post-save middleware to update content's save count
saveSchema.post('save', async function (doc) {
  const Model = mongoose.model(doc.contentModel);
  
  try {
    await Model.updateOne(
      { _id: doc.contentId },
      {
        $addToSet: { saves: doc.user },
        $inc: { saveCount: 1 },
      }
    );
  } catch (error) {
    console.error('Error updating save count on save:', error);
  }
});

// Post-delete middleware to update content's save count
saveSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;

  const Model = mongoose.model(doc.contentModel);
  
  try {
    await Model.updateOne(
      { _id: doc.contentId },
      {
        $pull: { saves: doc.user },
        $inc: { saveCount: -1 },
      }
    );
  } catch (error) {
    console.error('Error updating save count on delete:', error);
  }
});

// Post-deleteOne middleware
saveSchema.post('deleteOne', { document: true, query: false }, async function () {
  const doc = this;
  const Model = mongoose.model(doc.contentModel);
  
  try {
    await Model.updateOne(
      { _id: doc.contentId },
      {
        $pull: { saves: doc.user },
        $inc: { saveCount: -1 },
      }
    );
  } catch (error) {
    console.error('Error updating save count on deleteOne:', error);
  }
});

module.exports = mongoose.model('Save', saveSchema);
