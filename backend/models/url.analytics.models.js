import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "URL",
    required: true,
    unique: true, // Added unique constraint
    index: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // ============= AGGREGATE METRICS =============
  totalClicks: {
    type: Number,
    default: 0,
    min: 0
  },

  uniqueVisitors: {
    type: Number,
    default: 0,
    min: 0
  },

  // ADDED: Store unique visitor IDs for tracking
  uniqueVisitorIds: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 10000; // Limit to prevent document bloat
      },
      message: 'Too many unique visitors tracked'
    }
  },

  // ============= TIME-BASED ANALYTICS =============
  clicksByDate: [{
    date: {
      type: String, // Changed to String for YYYY-MM-DD format
      required: true
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
      min: 0
    }
  }],

  clicksByHour: {
    type: [Number],
    default: () => Array(24).fill(0), // 0-23 hours
    validate: {
      validator: function(arr) {
        return arr.length === 24;
      },
      message: 'clicksByHour must have exactly 24 elements'
    }
  },

  clicksByDay: {
    type: [Number],
    default: () => Array(7).fill(0), // 0=Sunday, 6=Saturday
    validate: {
      validator: function(arr) {
        return arr.length === 7;
      },
      message: 'clicksByDay must have exactly 7 elements'
    }
  },

  // ============= DEVICE ANALYTICS =============
  deviceBreakdown: {
    mobile: { type: Number, default: 0, min: 0 },
    desktop: { type: Number, default: 0, min: 0 },
    tablet: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 }
  },

  browserBreakdown: {
    type: Map,
    of: Number,
    default: () => new Map()
  },

  osBreakdown: {
    type: Map,
    of: Number,
    default: () => new Map()
  },

  // ============= GEOGRAPHIC ANALYTICS =============
  countryBreakdown: {
    type: Map,
    of: Number,
    default: () => new Map()
  },

  cityBreakdown: {
    type: Map,
    of: Number,
    default: () => new Map()
  },

  // ============= REFERRER ANALYTICS =============
  referrerBreakdown: {
    type: Map,
    of: Number,
    default: () => new Map()
  },

  socialMediaBreakdown: {
    instagram: { type: Number, default: 0, min: 0 },
    facebook: { type: Number, default: 0, min: 0 },
    twitter: { type: Number, default: 0, min: 0 },
    tiktok: { type: Number, default: 0, min: 0 },
    linkedin: { type: Number, default: 0, min: 0 },
    youtube: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 }
  },

  // ============= CONVERSION TRACKING =============
  conversions: {
    type: Number,
    default: 0,
    min: 0
  },

  conversionRate: {
    type: Number,
    default: 0,
    min: 0
  },

  revenue: {
    type: Number,
    default: 0,
    min: 0
  },

  // ============= ENGAGEMENT METRICS =============
  averageSessionDuration: {
    type: Number,
    default: 0,
    min: 0
  },

  bounceRate: {
    type: Number,
    default: 0,
    min: 0
  },

  returnVisitorRate: {
    type: Number,
    default: 0,
    min: 0
  },

  // ============= METADATA =============
  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

// ============= INDEXES =============
analyticsSchema.index({ urlId: 1, owner: 1 });
analyticsSchema.index({ owner: 1, createdAt: -1 });
analyticsSchema.index({ 'clicksByDate.date': 1 });

// ============= PRE-SAVE HOOK =============
analyticsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// ============= VIRTUAL PROPERTIES =============
analyticsSchema.virtual('clickToVisitorRatio').get(function() {
  if (this.uniqueVisitors === 0) return 0;
  return (this.totalClicks / this.uniqueVisitors).toFixed(2);
});

// ============= INSTANCE METHODS =============

// Record a new click with all analytics data
analyticsSchema.methods.recordClick = async function(clickData) {
  const {
    device,
    browser,
    os,
    country,
    city,
    referrer,
    isUnique,
    hour,
    day,
    visitorId
  } = clickData;

  // Initialize uniqueVisitorIds if it doesn't exist
  if (!this.uniqueVisitorIds) {
    this.uniqueVisitorIds = [];
  }

  // Increment total clicks
  this.totalClicks += 1;

  // Handle unique visitor
  if (isUnique && visitorId) {
    // Limit array size to prevent document bloat
    if (this.uniqueVisitorIds.length >= 10000) {
      this.uniqueVisitorIds = this.uniqueVisitorIds.slice(-9999);
    }
    this.uniqueVisitorIds.push(visitorId);
    this.uniqueVisitors += 1;
  }

  // Update hourly breakdown
  if (hour !== undefined && hour >= 0 && hour < 24) {
    this.clicksByHour[hour] = (this.clicksByHour[hour] || 0) + 1;
  }

  // Update daily breakdown
  if (day !== undefined && day >= 0 && day < 7) {
    this.clicksByDay[day] = (this.clicksByDay[day] || 0) + 1;
  }

  // Update device breakdown
  if (device && this.deviceBreakdown[device] !== undefined) {
    this.deviceBreakdown[device] += 1;
  }

  // Update browser breakdown
  if (browser) {
    const current = this.browserBreakdown.get(browser) || 0;
    this.browserBreakdown.set(browser, current + 1);
  }

  // Update OS breakdown
  if (os) {
    const current = this.osBreakdown.get(os) || 0;
    this.osBreakdown.set(os, current + 1);
  }

  // Update country breakdown
  if (country) {
    const current = this.countryBreakdown.get(country) || 0;
    this.countryBreakdown.set(country, current + 1);
  }

  // Update city breakdown
  if (city) {
    const current = this.cityBreakdown.get(city) || 0;
    this.cityBreakdown.set(city, current + 1);
  }

  // Update referrer breakdown
  if (referrer) {
    const current = this.referrerBreakdown.get(referrer) || 0;
    this.referrerBreakdown.set(referrer, current + 1);
  }

  // Update date-based clicks (using string format YYYY-MM-DD)
  const dateKey = new Date().toISOString().split('T')[0];

  const dateEntry = this.clicksByDate.find(entry => entry.date === dateKey);

  if (dateEntry) {
    dateEntry.clicks += 1;
    if (isUnique) dateEntry.uniqueVisitors = (dateEntry.uniqueVisitors || 0) + 1;
  } else {
    this.clicksByDate.push({
      date: dateKey,
      clicks: 1,
      uniqueVisitors: isUnique ? 1 : 0
    });
  }

  await this.save();
  return this;
};

// Get recent clicks (last N days)
analyticsSchema.methods.getRecentClicks = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];
  
  return this.clicksByDate
    .filter(entry => entry.date >= cutoffStr)
    .reduce((sum, entry) => sum + entry.clicks, 0);
};

// ============= STATIC METHODS =============

// Cleanup old visitor IDs (call periodically via cron job)
analyticsSchema.statics.cleanupVisitorIds = async function(maxVisitors = 10000) {
  const docsToCleanup = await this.find({
    $expr: { $gt: [{ $size: '$uniqueVisitorIds' }, maxVisitors] }
  });
  
  let cleanedCount = 0;
  for (const doc of docsToCleanup) {
    doc.uniqueVisitorIds = doc.uniqueVisitorIds.slice(-maxVisitors);
    await doc.save();
    cleanedCount++;
  }
  
  return cleanedCount;
};

// Get analytics summary for a user
analyticsSchema.statics.getUserSummary = async function(ownerId) {
  const summary = await this.aggregate([
    { $match: { owner: ownerId } },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: '$totalClicks' },
        totalUniqueVisitors: { $sum: '$uniqueVisitors' },
        totalUrls: { $sum: 1 }
      }
    }
  ]);
  
  return summary[0] || { totalClicks: 0, totalUniqueVisitors: 0, totalUrls: 0 };
};

export const Analytics = mongoose.model("Analytics", analyticsSchema);