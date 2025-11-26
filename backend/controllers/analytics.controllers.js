import mongoose from "mongoose";
import { URL } from "../models/url.models.js";
import { Analytics } from "../models/url.analytics.models.js";

// Get aggregated stats for user
export const getUserStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const [stats] = await URL.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: null,
          totalLinks: { $sum: 1 },
          totalClicks: { $sum: "$clickCount" },
          avgClicks: { $avg: "$clickCount" }
        }
      }
    ]);

    // Get top performing link
    const topLink = await URL.findOne({ owner: req.user.userId })
      .sort({ clickCount: -1 })
      .select('shortUrl longUrl clickCount title')
      .lean();

    res.json({
      success: true,
      data: {
        totalLinks: stats?.totalLinks || 0,
        totalClicks: stats?.totalClicks || 0,
        avgClicks: Math.round(stats?.avgClicks || 0),
        topLink
      }
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stats'
    });
  }
};

// Get all URLs for a user with pagination and filtering
export const getUserUrls = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      collection = null,
      search = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = { owner: userId };
    
    // Filter by collection
    if (collection) {
      if (collection === 'null' || collection === 'none') {
        query.collection = null;
      } else {
        query.collection = collection;
      }
    }

    // Search by title, description, or URL
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { longUrl: { $regex: search, $options: 'i' } },
        { shortUrl: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const skip = (page - 1) * limit;

    const [urls, total] = await Promise.all([
      URL.find(query)
        .populate('collection', 'name color')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      URL.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        urls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUrls: total,
          hasMore: skip + urls.length < total
        }
      }
    });
  } catch (err) {
    console.error('Error fetching user URLs:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching URLs'
    });
  }
};

// Get detailed analytics for a specific URL
export const getUrlAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { period = '30d' } = req.query; // 7d, 30d, 90d, all

    // Verify URL ownership
    const urlDoc = await URL.findOne({ _id: id, owner: userId });
    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or unauthorized'
      });
    }

    // Get analytics
    const analytics = await Analytics.findOne({ urlId: id });
    if (!analytics) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalClicks: 0,
            uniqueVisitors: 0,
            clickGrowth: 0,
            averageClicksPerDay: 0
          },
          clicksByDate: [],
          clicksByHour: Array(24).fill(0),
          clicksByDay: Array(7).fill(0),
          deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, other: 0 },
          topBrowsers: {},
          osBreakdown: {},
          topCountries: {},
          topCities: {},
          topReferrers: {}
        }
      });
    }

    // Filter clicksByDate based on period
    let filteredClicks = analytics.clicksByDate;
    if (period !== 'all') {
      const days = parseInt(period);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];
      
      filteredClicks = analytics.clicksByDate.filter(
        entry => entry.date >= cutoffStr
      );
    }

    // Calculate growth metrics
    const calculateGrowth = (data) => {
      if (data.length < 2) return 0;
      const recent = data.slice(-7).reduce((sum, d) => sum + d.clicks, 0);
      const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.clicks, 0);
      if (previous === 0) return recent > 0 ? 100 : 0;
      return ((recent - previous) / previous) * 100;
    };

    const clickGrowth = calculateGrowth(filteredClicks);

    // Convert Maps to plain objects first to avoid serialization issues
    const browserObj = analytics.browserBreakdown instanceof Map 
      ? Object.fromEntries(analytics.browserBreakdown) 
      : analytics.browserBreakdown || {};
    
    const countryObj = analytics.countryBreakdown instanceof Map 
      ? Object.fromEntries(analytics.countryBreakdown) 
      : analytics.countryBreakdown || {};
    
    const cityObj = analytics.cityBreakdown instanceof Map 
      ? Object.fromEntries(analytics.cityBreakdown) 
      : analytics.cityBreakdown || {};
    
    const referrerObj = analytics.referrerBreakdown instanceof Map 
      ? Object.fromEntries(analytics.referrerBreakdown) 
      : analytics.referrerBreakdown || {};
    
    const osObj = analytics.osBreakdown instanceof Map 
      ? Object.fromEntries(analytics.osBreakdown) 
      : analytics.osBreakdown || {};

    // Top performers - now working with plain objects
    const topBrowsers = Object.entries(browserObj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    const topCountries = Object.entries(countryObj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    const topReferrers = Object.entries(referrerObj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    
    const topCities = Object.entries(cityObj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    res.json({
      success: true,
      data: {
        summary: {
          totalClicks: analytics.totalClicks,
          uniqueVisitors: analytics.uniqueVisitors,
          clickGrowth: parseFloat(clickGrowth.toFixed(2)),
          averageClicksPerDay: filteredClicks.length > 0 
            ? (filteredClicks.reduce((sum, d) => sum + d.clicks, 0) / filteredClicks.length).toFixed(2)
            : 0
        },
        clicksByDate: filteredClicks,
        clicksByHour: analytics.clicksByHour,
        clicksByDay: analytics.clicksByDay,
        deviceBreakdown: analytics.deviceBreakdown,
        topBrowsers,
        osBreakdown: osObj,
        topCountries,
        topCities,
        topReferrers,
        urlInfo: {
          title: urlDoc.title,
          shortUrl: urlDoc.shortUrl,
          longUrl: urlDoc.longUrl,
          createdAt: urlDoc.createdAt
        }
      }
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
};

// Get detailed information about a specific URL
export const getUrlDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const urlDoc = await URL.findOne({ _id: id, owner: userId })
      .populate('collection', 'name color')
      .lean();

    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or unauthorized'
      });
    }

    // Get basic analytics
    const analytics = await Analytics.findOne({ urlId: id })
      .select('totalClicks uniqueVisitors')
      .lean();

    res.json({
      success: true,
      data: {
        ...urlDoc,

        analytics: analytics || { totalClicks: 0, uniqueVisitors: 0 }
      }
    });
  } catch (err) {
    console.error('Error fetching URL details:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching URL details'
    });
  }
};

// Get aggregated analytics for all user URLs
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = '30d' } = req.query;

    // Fetch all analytics documents for this user
    const allAnalytics = await Analytics.find({ owner: userId }).lean();

    // Initialize aggregated data structure
    const aggregated = {
      totalClicks: 0,
      uniqueVisitors: 0,
      clicksByDate: new Map(),
      clicksByHour: Array(24).fill(0),
      clicksByDay: Array(7).fill(0),
      deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, other: 0 },
      browserBreakdown: new Map(),
      osBreakdown: new Map(),
      countryBreakdown: new Map(),
      cityBreakdown: new Map(),
      referrerBreakdown: new Map()
    };

    // Helper to aggregate maps
    const aggregateMap = (sourceMap, targetMap) => {
      if (!sourceMap) return;
      const entries = sourceMap instanceof Map ? sourceMap.entries() : Object.entries(sourceMap);
      for (const [key, value] of entries) {
        targetMap.set(key, (targetMap.get(key) || 0) + value);
      }
    };

    // Aggregate data
    for (const doc of allAnalytics) {
      aggregated.totalClicks += doc.totalClicks || 0;
      aggregated.uniqueVisitors += doc.uniqueVisitors || 0;

      // Clicks by Date
      if (doc.clicksByDate) {
        doc.clicksByDate.forEach(entry => {
          const existing = aggregated.clicksByDate.get(entry.date) || { clicks: 0, uniqueVisitors: 0 };
          existing.clicks += entry.clicks;
          existing.uniqueVisitors += entry.uniqueVisitors || 0;
          aggregated.clicksByDate.set(entry.date, existing);
        });
      }

      // Clicks by Hour
      if (doc.clicksByHour) {
        doc.clicksByHour.forEach((count, idx) => {
          aggregated.clicksByHour[idx] += count;
        });
      }

      // Clicks by Day
      if (doc.clicksByDay) {
        doc.clicksByDay.forEach((count, idx) => {
          aggregated.clicksByDay[idx] += count;
        });
      }

      // Device Breakdown
      if (doc.deviceBreakdown) {
        aggregated.deviceBreakdown.mobile += doc.deviceBreakdown.mobile || 0;
        aggregated.deviceBreakdown.desktop += doc.deviceBreakdown.desktop || 0;
        aggregated.deviceBreakdown.tablet += doc.deviceBreakdown.tablet || 0;
        aggregated.deviceBreakdown.other += doc.deviceBreakdown.other || 0;
      }

      // Map Breakdowns
      aggregateMap(doc.browserBreakdown, aggregated.browserBreakdown);
      aggregateMap(doc.osBreakdown, aggregated.osBreakdown);
      aggregateMap(doc.countryBreakdown, aggregated.countryBreakdown);
      aggregateMap(doc.cityBreakdown, aggregated.cityBreakdown);
      aggregateMap(doc.referrerBreakdown, aggregated.referrerBreakdown);
    }

    // Filter by period
    let clicksByDateArray = Array.from(aggregated.clicksByDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (period !== 'all') {
      const days = parseInt(period);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];
      clicksByDateArray = clicksByDateArray.filter(entry => entry.date >= cutoffStr);
    }

    // Helper to get top N from map
    const getTopN = (map, n = 5) => {
      return Object.fromEntries(
        Array.from(map.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, n)
      );
    };

    // Get top performing link
    const topLink = await URL.findOne({ owner: userId })
      .sort({ clickCount: -1 })
      .select('title shortUrl longUrl clickCount')
      .lean();

    res.json({
      success: true,
      data: {
        summary: {
          totalClicks: aggregated.totalClicks,
          uniqueVisitors: aggregated.uniqueVisitors,
          totalLinks: allAnalytics.length, // Approximation
          averageClicksPerLink: allAnalytics.length > 0 
            ? (aggregated.totalClicks / allAnalytics.length).toFixed(2) 
            : 0
        },
        clicksByDate: clicksByDateArray,
        clicksByHour: aggregated.clicksByHour,
        clicksByDay: aggregated.clicksByDay,
        deviceBreakdown: aggregated.deviceBreakdown,
        topBrowsers: getTopN(aggregated.browserBreakdown),
        osBreakdown: Object.fromEntries(aggregated.osBreakdown),
        topCountries: getTopN(aggregated.countryBreakdown, 10),
        topCities: getTopN(aggregated.cityBreakdown, 10),
        topReferrers: getTopN(aggregated.referrerBreakdown, 10),
        topLink
      }
    });

  } catch (err) {
    console.error('Error fetching user analytics:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user analytics'
    });
  }
};
