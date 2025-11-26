import { URL } from "../models/url.models.js";
import { Analytics } from "../models/url.analytics.models.js";
import { Collection } from "../models/collections.models.js";
import { CollectionAnalytics } from "../models/collections.analytics.models.js";
import {
  generateShortUrl,
  validateUrl,
  generateQRCode,
  fetchUrlMetadata,
} from "../utils/generateShortUrl.js";
import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";

// ============= CREATE COLLECTION =============
export const createCollection = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      isPublic, 
      image, 
      color, 
      icon, 
      tags, 
      createShortUrl: shouldCreateShortUrl,
      password 
    } = req.body;
    
    const userId = req.user.userId;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Collection name is required"
      });
    }

    // Generate unique slug
    const slug = await Collection.generateSlug(name, userId);

    // Generate short URL for collection if requested
    let collectionShortUrl = `c-${generateShortUrl(6)}`;
    if (shouldCreateShortUrl) {
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        collectionShortUrl = `c-${generateShortUrl(6)}`;
        const existing = await Collection.findOne({ collectionShortUrl });
        if (!existing) isUnique = true;
        else attempts++;
      }
      
      if (!isUnique) {
        collectionShortUrl = null; // Fallback to null if can't generate
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create collection
    const collection = new Collection({
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      owner: userId,
      isPublic: isPublic || false,
      image: image || '',
      color: color || '#3b82f6',
      icon: icon || 'folder',
      tags: tags || [],
      collectionShortUrl,
      links: [],
      linkCount: 0,
      password: hashedPassword
    });

    await collection.save();

    // Create analytics document
    await CollectionAnalytics.createOrUpdate(collection._id, userId);

    res.status(201).json({
      success: true,
      message: "Collection created successfully",
      data: {
        ...collection.toObject(),
        fullCollectionUrl: collection.fullCollectionUrl,
        hasPassword: !!hashedPassword
      }
    });
  } catch (err) {
    console.error('Error creating collection:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A collection with this name already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error creating collection"
    });
  }
};

// ============= GET ALL USER COLLECTIONS =============
export const getUserCollections = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = { owner: userId };
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      Collection.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Collection.countDocuments(query)
    ]);

    // Add analytics summary to each collection
    const collectionsWithStats = await Promise.all(
      collections.map(async (collection) => {
        const analytics = await CollectionAnalytics.findOne({ 
          collectionId: collection._id 
        }).lean();
        
        return {
          ...collection,
          hasPassword: !!collection.password,
          analytics: analytics ? {
            totalClicks: analytics.totalClicks,
            uniqueVisitors: analytics.uniqueVisitors,
            lastClickedAt: analytics.lastClickedAt
          } : {
            totalClicks: 0,
            uniqueVisitors: 0,
            lastClickedAt: null
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        collections: collectionsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCollections: total,
          hasMore: skip + collections.length < total
        }
      }
    });
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({
      success: false,
      message: "Server error fetching collections"
    });
  }
};

// ============= GET SINGLE COLLECTION =============
export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const collection = await Collection.findOne({ 
      _id: id, 
      owner: userId 
    })
      .populate({
        path: 'links',
        select: 'title description shortUrl customShortUrl longUrl clickCount uniqueVisitors createdAt image tags'
      })
      .lean();

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      });
    }

    // Get analytics
    const analytics = await CollectionAnalytics.findOne({ 
      collectionId: collection._id 
    }).lean();

    res.json({
      success: true,
      data: {
        ...collection,
        hasPassword: !!collection.password,
        analytics: analytics || {
          totalClicks: 0,
          uniqueVisitors: 0
        }
      }
    });
  } catch (err) {
    console.error('Error fetching collection:', err);
    res.status(500).json({
      success: false,
      message: "Server error fetching collection"
    });
  }
};

// ============= UPDATE COLLECTION =============
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, isPublic, image, color, icon, tags, password } = req.body;

    const collection = await Collection.findOne({ _id: id, owner: userId }).select('+password');

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      });
    }

    // Update fields
    if (name && name.trim() !== '') {
      collection.name = name.trim();
      // Regenerate slug if name changed
      collection.slug = await Collection.generateSlug(name, userId);
    }
    
    if (description !== undefined) collection.description = description.trim();
    if (isPublic !== undefined) collection.isPublic = isPublic;
    if (image !== undefined) collection.image = image;
    if (color !== undefined) collection.color = color;
    if (icon !== undefined) collection.icon = icon;
    if (tags !== undefined) collection.tags = tags;

    if (password) {
      collection.password = await bcrypt.hash(password, 10);
    }

    await collection.save();

    res.json({
      success: true,
      message: "Collection updated successfully",
      data: {
        ...collection.toObject(),
        hasPassword: !!collection.password
      }
    });
  } catch (err) {
    console.error('Error updating collection:', err);
    res.status(500).json({
      success: false,
      message: "Server error updating collection"
    });
  }
};

// ============= DELETE COLLECTION =============
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { deleteUrls = false } = req.query;

    const collection = await Collection.findOne({ _id: id, owner: userId });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      });
    }

    // If deleteUrls is true, delete all URLs in the collection
    if (deleteUrls === 'true') {
      await URL.deleteMany({ _id: { $in: collection.links } });
      await Analytics.deleteMany({ urlId: { $in: collection.links } });
    } else {
      // Just remove collection reference from URLs
      await URL.updateMany(
        { _id: { $in: collection.links } },
        { $unset: { collection: "" } }
      );
    }

    // Delete collection analytics
    await CollectionAnalytics.deleteOne({ collectionId: collection._id });

    // Delete collection
    await Collection.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "Collection deleted successfully"
    });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({
      success: false,
      message: "Server error deleting collection"
    });
  }
};

// ============= ADD URL TO COLLECTION =============
export const addUrlToCollection = async (req, res) => {
  try {
    const { id } = req.params; // Collection ID
    const { urlId } = req.body;
    const userId = req.user.userId;

    // Find collection
    const collection = await Collection.findOne({ _id: id, owner: userId });
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      });
    }

    // Find URL and verify ownership
    const url = await URL.findOne({ _id: urlId, owner: userId });
    if (!url) {
      return res.status(404).json({
        success: false,
        message: "URL not found or unauthorized"
      });
    }

    // Check if URL is already in collection
    if (collection.links.includes(urlId)) {
      return res.status(400).json({
        success: false,
        message: "URL already in collection"
      });
    }

    // Add URL to collection
    await collection.addLink(urlId);

    // Update URL's collection reference
    url.collection = collection._id;
    await url.save();

    res.json({
      success: true,
      message: "URL added to collection successfully",
      data: collection
    });
  } catch (err) {
    console.error('Error adding URL to collection:', err);
    res.status(500).json({
      success: false,
      message: "Server error adding URL to collection"
    });
  }
};

// ============= REMOVE URL FROM COLLECTION =============
export const removeUrlFromCollection = async (req, res) => {
  try {
    const { id, urlId } = req.params;
    const userId = req.user.userId;

    const collection = await Collection.findOne({ _id: id, owner: userId });
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      });
    }

    // Remove URL from collection
    await collection.removeLink(urlId);

    // Remove collection reference from URL
    await URL.findByIdAndUpdate(urlId, { $unset: { collection: "" } });

    res.json({
      success: true,
      message: "URL removed from collection successfully",
      data: collection
    });
  } catch (err) {
    console.error('Error removing URL from collection:', err);
    res.status(500).json({
      success: false,
      message: "Server error removing URL from collection"
    });
  }
};

// ============= GET COLLECTION ANALYTICS =============
export const getCollectionAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { period = '30d' } = req.query;

    // Verify collection ownership
    const collection = await Collection.findOne({ _id: id, owner: userId });
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      });
    }

    // Get all URL analytics in this collection
    const urlAnalytics = await Analytics.find({
      urlId: { $in: collection.links }
    }).lean();

    // Get or create collection analytics
    let collectionAnalytics = await CollectionAnalytics.findOne({ 
      collectionId: collection._id 
    });

    if (!collectionAnalytics) {
      collectionAnalytics = await CollectionAnalytics.createOrUpdate(
        collection._id, 
        userId
      );
    }

    // Aggregate analytics from all URLs
    await collectionAnalytics.aggregateFromUrls(urlAnalytics);

    // Filter by period
    let filteredClicks = collectionAnalytics.clicksByDate;
    if (period !== 'all') {
      const days = parseInt(period);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];
      
      filteredClicks = collectionAnalytics.clicksByDate.filter(
        entry => entry.date >= cutoffStr
      );
    }

    // Get top performing links
    const topLinks = collectionAnalytics.getTopLinks(10);
    
    // Populate link details
    const topLinksWithDetails = await Promise.all(
      topLinks.map(async (linkStat) => {
        const url = await URL.findById(linkStat.linkId)
          .select('title shortUrl customShortUrl longUrl')
          .lean();
        return {
          ...linkStat.toObject(),
          urlDetails: url
        };
      })
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalClicks: collectionAnalytics.totalClicks,
          uniqueVisitors: collectionAnalytics.uniqueVisitors,
          totalLinks: collection.linkCount,
          averageClicksPerLink: collection.linkCount > 0 
            ? (collectionAnalytics.totalClicks / collection.linkCount).toFixed(2) 
            : 0
        },
        clicksByDate: filteredClicks,
        clicksByHour: collectionAnalytics.clicksByHour,
        clicksByDay: collectionAnalytics.clicksByDay,
        deviceBreakdown: collectionAnalytics.deviceBreakdown,
        topBrowsers: Object.fromEntries(
          Array.from(collectionAnalytics.browserBreakdown.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
        ),
        topCountries: Object.fromEntries(
          Array.from(collectionAnalytics.countryBreakdown.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
        ),
        topReferrers: Object.fromEntries(
          Array.from(collectionAnalytics.referrerBreakdown.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
        ),
        topLinks: topLinksWithDetails,
        collectionInfo: {
          name: collection.name,
          slug: collection.slug,
          linkCount: collection.linkCount,
          createdAt: collection.createdAt
        }
      }
    });
  } catch (err) {
    console.error('Error fetching collection analytics:', err);
    res.status(500).json({
      success: false,
      message: "Server error fetching collection analytics"
    });
  }
};

// ============= GET PUBLIC COLLECTION (No auth required) =============
export const getPublicCollection = async (req, res) => {
  try {
    const { slug } = req.params;
    const { password } = req.query;

    // Find public collection by slug or short URL
    const collection = await Collection.findOne({
      $or: [{ slug }, { collectionShortUrl: slug }],
      isPublic: true,
    })
      .select('+password') // Include password field to check if it exists
      .populate({
        path: "links",
        select: "title description shortUrl customShortUrl longUrl image tags createdAt",
        match: { isActive: true },
      })
      .populate("owner", "userName profilePicUrl")
      .lean();

    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: "Public collection not found" });
    }

    // Check password protection
    if (collection.password) {
      if (!password) {
        return res.status(403).json({
          success: false,
          message: "Password required",
          passwordRequired: true
        });
      }

      const isMatch = await bcrypt.compare(password, collection.password);
      if (!isMatch) {
        return res.status(403).json({
          success: false,
          message: "Invalid password",
          passwordRequired: true
        });
      }
    }

    // Remove password from response
    delete collection.password;

    res.json({
      success: true,
      data: collection,
    });
  } catch (err) {
    console.error("Error fetching public collection:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching collection" });
  }
};

// ============= MOVE URL TO DIFFERENT COLLECTION =============
export const moveUrlToCollection = async (req, res) => {
  try {
    const { id } = req.params; // Collection ID
    const { urlId, targetCollectionId } = req.body;
    const userId = req.user.userId;

    // Verify URL ownership
    const url = await URL.findOne({ _id: urlId, owner: userId });
    if (!url) {
      return res.status(404).json({
        success: false,
        message: "URL not found or unauthorized"
      });
    }

    // Remove from current collection
    if (url.collection) {
      const currentCollection = await Collection.findById(url.collection);
      if (currentCollection) {
        await currentCollection.removeLink(urlId);
      }
    }

    // Add to target collection
    if (targetCollectionId) {
      const targetCollection = await Collection.findOne({
        _id: targetCollectionId,
        owner: userId
      });

      if (!targetCollection) {
        return res.status(404).json({
          success: false,
          message: "Target collection not found"
        });
      }

      await targetCollection.addLink(urlId);
      url.collection = targetCollectionId;
    } else {
      url.collection = null;
    }

    await url.save();

    res.json({
      success: true,
      message: "URL moved successfully",
      data: url
    });
  } catch (err) {
    console.error('Error moving URL:', err);
    res.status(500).json({
      success: false,
      message: "Server error moving URL"
    });
  }
};

// ============= BULK ADD URLs TO COLLECTION =============
export const bulkAddUrlsToCollection = async (req, res) => {
  try {
    const { id } = req.params; // Collection ID
    const { urlIds } = req.body; // Array of URL IDs
    const userId = req.user.userId;

    if (!Array.isArray(urlIds) || urlIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "urlIds must be a non-empty array"
      });
    }

    // Find collection
    const collection = await Collection.findOne({ _id: id, owner: userId });
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      });
    }

    // Find all URLs and verify ownership
    const urls = await URL.find({ 
      _id: { $in: urlIds }, 
      owner: userId 
    });

    if (urls.length !== urlIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some URLs not found or unauthorized"
      });
    }

    let addedCount = 0;
    let skippedCount = 0;

    // Add each URL to collection
    for (const url of urls) {
      if (!collection.links.includes(url._id)) {
        await collection.addLink(url._id);
        url.collection = collection._id;
        await url.save();
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    res.json({
      success: true,
      message: `Added ${addedCount} URLs to collection. Skipped ${skippedCount} duplicates.`,
      data: {
        addedCount,
        skippedCount,
        collection
      }
    });
  } catch (err) {
    console.error('Error bulk adding URLs:', err);
    res.status(500).json({
      success: false,
      message: "Server error adding URLs to collection"
    });
  }
};

// ============= TOGGLE BOOKMARK COLLECTION =============
export const bookmarkCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if collection exists
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already bookmarked
    // bookmarks is array of ObjectIds
    const isBookmarked = user.bookmarks.some(b => b.toString() === id);

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarks = user.bookmarks.filter(b => b.toString() !== id);
    } else {
      // Add bookmark
      user.bookmarks.push(id);
    }

    await user.save();

    res.json({
      success: true,
      message: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      bookmarked: !isBookmarked
    });
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    res.status(500).json({
      success: false,
      message: "Server error toggling bookmark"
    });
  }
};