import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Collection name is required"],
    trim: true,
    maxlength: [100, "Collection name cannot exceed 100 characters"]
  },

  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // Array of URL IDs in this collection
  links: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "URL"
  }],

  // Link count for quick access
  linkCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Collaborators (for future implementation)
  collaborators: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    role: { 
      type: String, 
      enum: ["viewer", "editor", "admin"], 
      default: "viewer" 
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Public/Private visibility
  isPublic: { 
    type: Boolean, 
    default: false 
  },

  // Collection thumbnail/image
  image: {
    type: String,
    trim: true
  },

  // Collection color/theme (for UI customization)
  color: {
    type: String,
    default: "#3b82f6", // blue-500
    trim: true
  },

  // Icon for the collection
  icon: {
    type: String,
    default: "folder",
    trim: true
  },

  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Collection short URL (if they want to share the collection itself)
  collectionShortUrl: {
    type: String,
    unique: true,
    sparse: true, // Allow null values, but enforce uniqueness when set
    trim: true
  },

  // Analytics summary (cached for performance)
  analytics: {
    totalClicks: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    lastActivity: { type: Date }
  },

  // Sort order for links (manual sorting)
  linkOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "URL"
  }],

  // Settings
  settings: {
    allowDuplicates: { type: Boolean, default: false },
    autoArchiveExpired: { type: Boolean, default: true },
    notifyOnClick: { type: Boolean, default: false }
  },

  // Password protection
  password: {
    type: String,
    select: false
  }

}, { 
  timestamps: true 
});

// ============= INDEXES =============
collectionSchema.index({ owner: 1, slug: 1 }, { unique: true });
collectionSchema.index({ owner: 1, createdAt: -1 });
collectionSchema.index({ isPublic: 1 });
collectionSchema.index({ collectionShortUrl: 1 }, { sparse: true });

// ============= VIRTUAL PROPERTIES =============
collectionSchema.virtual('fullCollectionUrl').get(function() {
  if (this.collectionShortUrl) {
    return `${process.env.BASE_URL}/c/${this.collectionShortUrl}`;
  }
  return `${process.env.BASE_URL}/collection/${this.slug}`;
});

// ============= INSTANCE METHODS =============

// Add a link to the collection
collectionSchema.methods.addLink = async function(linkId) {
  if (!this.links.includes(linkId)) {
    this.links.push(linkId);
    this.linkCount += 1;
    this.linkOrder.push(linkId);
    await this.save();
  }
  return this;
};

// Remove a link from the collection
collectionSchema.methods.removeLink = async function(linkId) {
  // Use atomic update to ensure consistency
  await this.model('Collection').updateOne(
    { _id: this._id },
    { 
      $pull: { links: linkId, linkOrder: linkId },
      $inc: { linkCount: -1 }
    }
  );
  
  // Update local instance to reflect changes
  const index = this.links.indexOf(linkId);
  if (index > -1) {
    this.links.splice(index, 1);
    this.linkCount = Math.max(0, this.linkCount - 1);
    
    const orderIndex = this.linkOrder.indexOf(linkId);
    if (orderIndex > -1) {
      this.linkOrder.splice(orderIndex, 1);
    }
  }
  
  return this;
};

// Update analytics summary
collectionSchema.methods.updateAnalyticsSummary = async function(clicks, visitors) {
  this.analytics.totalClicks = clicks;
  this.analytics.uniqueVisitors = visitors;
  this.analytics.lastActivity = new Date();
  await this.save();
  return this;
};

// Check if user has access to collection
collectionSchema.methods.hasAccess = function(userId) {
  const userIdStr = userId.toString();
  
  // Owner always has access
  if (this.owner.toString() === userIdStr) {
    return { hasAccess: true, role: 'owner' };
  }
  
  // Check collaborators
  const collaborator = this.collaborators.find(
    c => c.user.toString() === userIdStr
  );
  
  if (collaborator) {
    return { hasAccess: true, role: collaborator.role };
  }
  
  // Public collections are viewable by anyone
  if (this.isPublic) {
    return { hasAccess: true, role: 'viewer' };
  }
  
  return { hasAccess: false, role: null };
};

// ============= STATIC METHODS =============

// Generate unique slug
collectionSchema.statics.generateSlug = async function(name, ownerId, maxAttempts = 10) {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let attempt = 0;
  let uniqueSlug = slug;
  
  while (attempt < maxAttempts) {
    const existing = await this.findOne({ owner: ownerId, slug: uniqueSlug });
    
    if (!existing) {
      return uniqueSlug;
    }
    
    attempt++;
    uniqueSlug = `${slug}-${attempt}`;
  }
  
  // Fallback: add random string
  return `${slug}-${Date.now().toString(36)}`;
};

// Get user's collections with stats
collectionSchema.statics.getUserCollectionsWithStats = async function(ownerId) {
  return await this.aggregate([
    { $match: { owner: ownerId } },
    {
      $lookup: {
        from: 'urls',
        localField: 'links',
        foreignField: '_id',
        as: 'urlDetails'
      }
    },
    {
      $addFields: {
        totalLinks: { $size: '$links' },
        totalClicks: { $sum: '$urlDetails.clickCount' },
        totalUniqueVisitors: { $sum: '$urlDetails.uniqueVisitors' }
      }
    },
    {
      $project: {
        urlDetails: 0 // Remove detailed URL info
      }
    },
    { $sort: { createdAt: -1 } }
  ]);
};

// ============= PRE-SAVE HOOKS =============

// Ensure linkCount matches links array
collectionSchema.pre('save', function(next) {
  this.linkCount = this.links.length;
  next();
});

export const Collection = mongoose.model("Collection", collectionSchema);