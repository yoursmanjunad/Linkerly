import { URL } from "../models/url.models.js";
import { Analytics } from "../models/url.analytics.models.js";
import useragent from "useragent";
import geoip from "geoip-lite";
import bcrypt from "bcryptjs";

// Helper to extract visitor ID from cookies or create new one
const getVisitorId = (req, res) => {
  let visitorId = req.cookies.visitor_id;
  
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.cookie('visitor_id', visitorId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  
  return visitorId;
};

// Helper to get client IP address
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};

export const redirectShortUrl = async (req, res) => {
  try {
    // Use req.params.shortUrl as defined in the route /:shortUrl
    const shortUrl = req.params.shortUrl;
    
    if (!shortUrl) {
      return res.status(400).json({ 
        success: false,
        message: "Short URL is required" 
      });
    }

    // Find the URL document (including password field)
    // NOTE: We removed isActive: true from the query so we can find inactive URLs and redirect them to /expired
    const urlDoc = await URL.findOne({
      $or: [{ shortUrl }, { customShortUrl: shortUrl }]
    }).select('+password');

    console.log(`[Redirect Debug] Accessing: ${shortUrl}`);

    if (!urlDoc) {
      console.log(`[Redirect Debug] URL not found`);
      return res.status(404).json({ 
        success: false,
        message: "URL not found" 
      });
    }

    // Check if inactive or expired
    if (!urlDoc.isActive || (urlDoc.expiry && new Date(urlDoc.expiry) < new Date())) {
      // Ensure it's marked inactive if expired
      if (urlDoc.isActive && urlDoc.expiry && new Date(urlDoc.expiry) < new Date()) {
        await URL.findByIdAndUpdate(urlDoc._id, { isActive: false });
      }
      
      console.log(`[Redirect Debug] URL inactive or expired`);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/expired?url=${shortUrl}`);
    }

    // Check password protection
    if (urlDoc.password) {
      const providedPassword = req.query.password;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      if (!providedPassword) {
        console.log(`[Redirect Debug] Password required`);
        return res.redirect(`${frontendUrl}/password?url=${shortUrl}`);
      }

      const isMatch = await bcrypt.compare(providedPassword, urlDoc.password);
      if (!isMatch) {
        console.log(`[Redirect Debug] Invalid password`);
        return res.redirect(`${frontendUrl}/password?url=${shortUrl}&error=invalid`);
      }
      
      console.log(`[Redirect Debug] Password verified`);
    }

    // ============= ANALYTICS TRACKING =============

    const visitorId = getVisitorId(req, res);
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    
    let ua;
    try {
      ua = useragent.parse(userAgent);
    } catch (e) {
      ua = { device: { family: 'other' }, family: 'Unknown', os: { family: 'Unknown' } };
    }

    let geo;
    try {
      geo = geoip.lookup(ip);
    } catch (e) {
      geo = null;
    }

    const referer = req.headers.referer || req.headers.referrer || 'direct';

    // Determine device type
    let deviceType = 'other';
    if (ua && ua.device && ua.device.family) {
      deviceType = ua.device.family.toLowerCase();
    }
    
    let device = 'other';
    if (deviceType.includes('iphone') || deviceType.includes('android') || deviceType.includes('mobile')) {
      device = 'mobile';
    } else if (deviceType.includes('ipad') || deviceType.includes('tablet')) {
      device = 'tablet';
    } else if (deviceType !== 'other') {
      device = 'desktop';
    } else {
      device = 'desktop'; // Default to desktop if unknown
    }

    const browser = (ua && ua.family) || 'Unknown';
    const os = (ua && ua.os && ua.os.family) || 'Unknown';
    const country = (geo && geo.country) || 'Unknown';
    const city = (geo && geo.city) || 'Unknown';
    
    // Parse referrer domain
    let referrerDomain = 'direct';
    try {
      if (referer !== 'direct') {
        referrerDomain = new URL(referer).hostname;
      }
    } catch (e) {
      referrerDomain = 'direct';
    }

    // Current hour and day for time-based analytics
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0-6 (Sunday-Saturday)
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Find or create analytics document
      let analyticsDoc = await Analytics.findOne({ urlId: urlDoc._id });
      
      if (!analyticsDoc) {
        analyticsDoc = new Analytics({
          urlId: urlDoc._id,
          owner: urlDoc.owner,
          totalClicks: 0,
          uniqueVisitors: 0,
          clicksByDate: [],
          clicksByHour: Array(24).fill(0),
          clicksByDay: Array(7).fill(0),
          deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, other: 0 },
          browserBreakdown: {},
          osBreakdown: {},
          countryBreakdown: {},
          cityBreakdown: {},
          referrerBreakdown: {},
          uniqueVisitorIds: []
        });
      }

      // Check if this is a unique visitor
      const isUniqueVisitor = !analyticsDoc.uniqueVisitorIds.includes(visitorId);
      
      if (isUniqueVisitor) {
        analyticsDoc.uniqueVisitorIds.push(visitorId);
        analyticsDoc.uniqueVisitors += 1;
      }

      // Increment total clicks
      analyticsDoc.totalClicks += 1;

      // Update clicks by date
      const dateEntry = analyticsDoc.clicksByDate.find(d => d.date === dateKey);
      if (dateEntry) {
        dateEntry.clicks += 1;
      } else {
        analyticsDoc.clicksByDate.push({ date: dateKey, clicks: 1 });
      }

      // Update clicks by hour
      analyticsDoc.clicksByHour[hour] += 1;

      // Update clicks by day
      analyticsDoc.clicksByDay[day] += 1;

      // Update device breakdown
      analyticsDoc.deviceBreakdown[device] += 1;

      // Update browser breakdown
      analyticsDoc.browserBreakdown[browser] = 
        (analyticsDoc.browserBreakdown[browser] || 0) + 1;

      // Update OS breakdown
      analyticsDoc.osBreakdown[os] = 
        (analyticsDoc.osBreakdown[os] || 0) + 1;

      // Update country breakdown
      analyticsDoc.countryBreakdown[country] = 
        (analyticsDoc.countryBreakdown[country] || 0) + 1;

      // Update city breakdown
      analyticsDoc.cityBreakdown[city] = 
        (analyticsDoc.cityBreakdown[city] || 0) + 1;

      // Update referrer breakdown
      analyticsDoc.referrerBreakdown[referrerDomain] = 
        (analyticsDoc.referrerBreakdown[referrerDomain] || 0) + 1;

      // Save analytics
      await analyticsDoc.save();

      // Update URL document with basic stats
      await URL.findByIdAndUpdate(urlDoc._id, {
        $inc: { clickCount: 1 },
        $set: { 
          lastClickedAt: now,
          uniqueVisitors: analyticsDoc.uniqueVisitors
        }
      });

    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
      // Don't fail redirect if analytics fails
    }

    // ============= REDIRECT =============
    
    return res.redirect(301, urlDoc.longUrl); // 301 = Permanent redirect

  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Server error during redirect",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};