import mongoose from "mongoose";

const collectionAnalyticsSchema = new mongoose.Schema({
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    required: true,
    unique: true,
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

  lastClickedAt: {
    type: Date
  },

  // ============= TIME-BASED ANALYTICS =============
  clicksByDate: [{
    date: {
      type: String, // YYYY-MM-DD format
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
    default: () => Array(24).fill(0)
  },

  clicksByDay: {
    type: [Number],
    default: () => Array(7).fill(0)
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

  // ============= PER-LINK PERFORMANCE =============
  linkPerformance: [{
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "URL"
    },
    clicks: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    lastClicked: Date
  }],

  // ============= METADATA =============
  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

// ============= INDEXES =============
collectionAnalyticsSchema.index({ collectionId: 1 }, { unique: true });
collectionAnalyticsSchema.index({ owner: 1, createdAt: -1 });

// ============= INSTANCE METHODS =============

// Aggregate analytics from all URLs in collection
collectionAnalyticsSchema.methods.aggregateFromUrls = async function(urlAnalytics) {
  this.totalClicks = 0;
  this.uniqueVisitors = 0;
  
  const deviceTotals = { mobile: 0, desktop: 0, tablet: 0, other: 0 };
  const browserMap = new Map();
  const osMap = new Map();
  const countryMap = new Map();
  const cityMap = new Map();
  const referrerMap = new Map();
  const hourTotals = Array(24).fill(0);
  const dayTotals = Array(7).fill(0);
  const dateMap = new Map();
  
  // Reset link performance
  this.linkPerformance = [];

  // Helper to iterate over Map or Object
  const iterateMapOrObject = (source, callback) => {
    if (!source) return;
    if (source instanceof Map) {
      for (const [key, value] of source) callback(key, value);
    } else if (typeof source === 'object') {
      for (const [key, value] of Object.entries(source)) callback(key, value);
    }
  };

  // Aggregate from all URL analytics
  for (const analytics of urlAnalytics) {
    this.totalClicks += analytics.totalClicks || 0;
    this.uniqueVisitors += analytics.uniqueVisitors || 0;

    // Update link performance
    this.linkPerformance.push({
      linkId: analytics.urlId,
      clicks: analytics.totalClicks || 0,
      uniqueVisitors: analytics.uniqueVisitors || 0,
      lastClicked: analytics.lastClickedAt
    });

    // Device breakdown
    if (analytics.deviceBreakdown) {
      deviceTotals.mobile += analytics.deviceBreakdown.mobile || 0;
      deviceTotals.desktop += analytics.deviceBreakdown.desktop || 0;
      deviceTotals.tablet += analytics.deviceBreakdown.tablet || 0;
      deviceTotals.other += analytics.deviceBreakdown.other || 0;
    }

    // Browser breakdown
    iterateMapOrObject(analytics.browserBreakdown, (browser, count) => {
      browserMap.set(browser, (browserMap.get(browser) || 0) + count);
    });

    // OS breakdown
    iterateMapOrObject(analytics.osBreakdown, (os, count) => {
      osMap.set(os, (osMap.get(os) || 0) + count);
    });

    // Country breakdown
    iterateMapOrObject(analytics.countryBreakdown, (country, count) => {
      countryMap.set(country, (countryMap.get(country) || 0) + count);
    });

    // City breakdown
    iterateMapOrObject(analytics.cityBreakdown, (city, count) => {
      cityMap.set(city, (cityMap.get(city) || 0) + count);
    });

    // Referrer breakdown
    iterateMapOrObject(analytics.referrerBreakdown, (referrer, count) => {
      referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + count);
    });

    // Hour breakdown
    if (analytics.clicksByHour && Array.isArray(analytics.clicksByHour)) {
      analytics.clicksByHour.forEach((count, hour) => {
        if (hour >= 0 && hour < 24) {
          hourTotals[hour] += count || 0;
        }
      });
    }

    // Day breakdown
    if (analytics.clicksByDay && Array.isArray(analytics.clicksByDay)) {
      analytics.clicksByDay.forEach((count, day) => {
        if (day >= 0 && day < 7) {
          dayTotals[day] += count || 0;
        }
      });
    }

    // Date breakdown
    if (analytics.clicksByDate && Array.isArray(analytics.clicksByDate)) {
      analytics.clicksByDate.forEach(entry => {
        if (!entry || !entry.date) return;
        
        // Ensure date is a string
        const dateStr = entry.date instanceof Date 
          ? entry.date.toISOString().split('T')[0] 
          : String(entry.date);

        const existing = dateMap.get(dateStr) || { clicks: 0, uniqueVisitors: 0 };
        existing.clicks += entry.clicks || 0;
        existing.uniqueVisitors += entry.uniqueVisitors || 0;
        dateMap.set(dateStr, existing);
      });
    }
  }

  // Update collection analytics
  this.deviceBreakdown = deviceTotals;
  this.browserBreakdown = browserMap;
  this.osBreakdown = osMap;
  this.countryBreakdown = countryMap;
  this.cityBreakdown = cityMap;
  this.referrerBreakdown = referrerMap;
  this.clicksByHour = hourTotals;
  this.clicksByDay = dayTotals;
  
  // Convert date map to array
  this.clicksByDate = Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    clicks: data.clicks,
    uniqueVisitors: data.uniqueVisitors
  })).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return String(a.date).localeCompare(String(b.date));
  });

  this.lastUpdated = new Date();
  await this.save();
  
  return this;
};

// Get top performing links
collectionAnalyticsSchema.methods.getTopLinks = function(limit = 5) {
  return this.linkPerformance
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
};

// ============= STATIC METHODS =============

// Create or update collection analytics
collectionAnalyticsSchema.statics.createOrUpdate = async function(collectionId, owner) {
  let analytics = await this.findOne({ collectionId });
  
  if (!analytics) {
    analytics = new this({
      collectionId,
      owner,
      totalClicks: 0,
      uniqueVisitors: 0
    });
    await analytics.save();
  }
  
  return analytics;
};

export const CollectionAnalytics = mongoose.model("CollectionAnalytics", collectionAnalyticsSchema);