import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
  // ============= BASIC INFO =============
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  title: {
    type: String,
    trim: true,
    default: "Untitled Link"
  },

  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // ============= URL DATA =============
  longUrl: {
    type: String,
    required: true,
    trim: true,
  //   validate: {
  //   validator: (v) => validateUrl(v),
  //   message: "Invalid URL format"
  // }
  },

  shortUrl: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true
  },

  customShortUrl: {
    type: String,
    unique: true,
    sparse: true, // allows multiple null values
    trim: true,
    default: undefined,
    lowercase: true
  },

  // ============= ORGANIZATION =============
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    default: null,
    index: true
  },

  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  notes: {
    type: String,
    maxlength: 1000
  },

  // priority: {
  //   type: String,
  //   enum: ['low', 'medium', 'high'],
  //   default: 'medium'
  // },

  // ============= SECURITY & ACCESS =============
  password: {
    type: String,
    select: false // Don't return in queries by default
  },

  expiry: {
    type: Date,
    index: true // For efficient cleanup queries
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // ============= VISUAL =============
  image: {
    type: String,
    trim: true
  },

  hasQR: {
    type: Boolean,
    default: false
  },

  qrImageUrl: {
    type: String,
    trim: true
  },

  // ============= QUICK ANALYTICS (Embedded for Speed) =============
  clickCount: {
    type: Number,
    default: 0,
    min: 0
  },

  uniqueVisitors: {
    type: Number,
    default: 0,
    min: 0
  },

  lastClickedAt: {
    type: Date,
    default: null
  },

  // ============= LINK HEALTH MONITORING =============
  lastChecked: {
    type: Date,
    default: Date.now
  },

  httpStatus: {
    type: Number,
    default: null
  },

  isWorking: {
    type: Boolean,
    default: true
  },

  brokenSince: {
    type: Date,
    default: null
  },

  // ============= SHOPPING/PRICE TRACKING =============
  currentPrice: {
    type: Number,
    default: null
  },

  originalPrice: {
    type: Number,
    default: null
  },

  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },

  priceHistory: [{
    price: Number,
    checkedAt: {
      type: Date,
      default: Date.now
    }
  }],

  inStock: {
    type: Boolean,
    default: true
  },

  // ============= E-COMMERCE =============
  isPurchased: {
    type: Boolean,
    default: false
  },

  purchasedAt: {
    type: Date,
    default: null
  },

  // ============= UTM PARAMETERS =============
  utmParams: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },

  // ============= METADATA =============
  domain: {
    type: String,
    trim: true,
    lowercase: true
  },

  favicon: {
    type: String,
    trim: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============= INDEXES FOR PERFORMANCE =============
urlSchema.index({ owner: 1, createdAt: -1 });
urlSchema.index({ owner: 1, collection: 1 });
urlSchema.index({ owner: 1, tags: 1 });
urlSchema.index({ expiry: 1 }, { sparse: true });
urlSchema.index({ shortUrl: 1, isActive: 1 });

// ============= VIRTUAL FIELDS =============

// Full short URL
urlSchema.virtual('fullShortUrl').get(function() {
  return `${process.env.BASE_URL}/${this.shortUrl}`;
});

// Check if expired
urlSchema.virtual('isExpired').get(function() {
  if (!this.expiry) return false;
  return new Date() > this.expiry;
});

// Calculate discount percentage
urlSchema.virtual('discountPercentage').get(function() {
  if (!this.originalPrice || !this.currentPrice) return 0;
  return Math.round(((this.originalPrice - this.currentPrice) / this.originalPrice) * 100);
});

// ============= INSTANCE METHODS =============

// Check if URL is password protected
urlSchema.methods.hasPassword = function() {
  return !!this.password;
};

// Verify password
urlSchema.methods.verifyPassword = async function(candidatePassword) {
  if (!this.password) return true;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment click count
urlSchema.methods.incrementClick = async function(isUnique = false) {
  this.clickCount += 1;
  if (isUnique) this.uniqueVisitors += 1;
  this.lastClickedAt = new Date();
  await this.save();
};

// Check if link is accessible
urlSchema.methods.isAccessible = function() {
  if (!this.isActive) return { accessible: false, reason: 'Link is deactivated' };
  if (this.isExpired) return { accessible: false, reason: 'Link has expired' };
  if (!this.isWorking) return { accessible: false, reason: 'Destination is unreachable' };
  return { accessible: true };
};

// ============= STATIC METHODS =============

// Find active links for a user
urlSchema.statics.findActiveByOwner = function(ownerId) {
  return this.find({ 
    owner: ownerId, 
    isActive: true,
    $or: [
      { expiry: null },
      { expiry: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

// Find expired links
urlSchema.statics.findExpired = function() {
  return this.find({
    expiry: { $lte: new Date() },
    isActive: true
  });
};

// Find broken links
urlSchema.statics.findBroken = function(ownerId = null) {
  const query = { isWorking: false, isActive: true };
  if (ownerId) query.owner = ownerId;
  return this.find(query);
};

// ============= MIDDLEWARE =============

// Before save: Extract domain from longUrl
urlSchema.pre('save', function(next) {
  if (this.isModified('longUrl')) {
    try {
      const url = new URL(this.longUrl);
      this.domain = url.hostname;
    } catch (error) {
      console.error('Error extracting domain:', error);
    }
  }
  next();
});

// After save: Update collection links list
urlSchema.post("save", async function (doc, next) {
  try {
    if (doc.collection) {
      await mongoose.model("Collection").findByIdAndUpdate(
        doc.collection,
        { $addToSet: { links: doc._id } }
      );
    }
  } catch (error) {
    console.error("Error updating collection links:", error);
  }
  next();
});


// Before remove: Update collection link count
urlSchema.pre('remove', async function(next) {
  if (this.collection) {
    await mongoose.model('Collection').findByIdAndUpdate(
      this.collection,
      { 
        $pull: { links: this._id },
      }
    );
  }
  next();
});

export const URL = mongoose.model("URL", urlSchema);