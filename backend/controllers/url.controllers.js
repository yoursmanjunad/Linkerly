import { URL } from "../models/url.models.js";
import { Analytics } from "../models/url.analytics.models.js";
import { Collection } from "../models/collections.models.js";
import {
  generateShortUrl,
  generateQRCode,
  fetchUrlMetadata,
} from "../utils/generateShortUrl.js";
import bcrypt from "bcryptjs";

// Get metadata for a URL
export const getUrlMetadata = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "URL is required" });

    const metadata = await fetchUrlMetadata(url);
    res.json({ success: true, data: metadata });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch metadata" });
  }
};

export const generateQrCodeEndpoint = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }

    const qrCodeData = await generateQRCode(decodeURIComponent(url));
    res.json({ success: true, data: qrCodeData });
  } catch (error) {
    console.error("QR Code generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR code" });
  }
};

export const createShortUrl = async (req, res) => {
  try {
    const {
      title,
      description,
      longUrl,
      customShortUrl,
      collection,
      password,
      expiry,
      image,
      tags,
      notes,
      generateQR = false,
    } = req.body;

    const owner = req.user.userId;

    // ============= VALIDATION =============
    if (!longUrl) {
      return res.status(400).json({
        success: false,
        message: "Long URL is required",
      });
    }

    if (expiry && new Date(expiry) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be in the future",
      });
    }

    if (customShortUrl) {
      const customUrlRegex = /^[a-zA-Z0-9-_]+$/;
      if (!customUrlRegex.test(customShortUrl)) {
        return res.status(400).json({
          success: false,
          message: "Custom URL can only contain letters, numbers, hyphens, and underscores",
        });
      }

      if (customShortUrl.length < 3 || customShortUrl.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Custom URL must be between 3 and 50 characters",
        });
      }

      const existingCustom = await URL.findOne({
        $or: [
          { shortUrl: customShortUrl },
          { customShortUrl: customShortUrl },
        ],
      });

      if (existingCustom) {
        return res.status(400).json({
          success: false,
          message: "This custom URL is already taken. Please choose another.",
        });
      }
    }

    // Validate collection if provided
    let collectionDoc = null;
    if (collection) {
      collectionDoc = await Collection.findOne({
        _id: collection,
        owner: owner,
      });

      if (!collectionDoc) {
        return res.status(404).json({
          success: false,
          message: "Collection not found or you don't have access",
        });
      }
    }

    // ============= GENERATE SHORT URL =============
    let shortUrl = customShortUrl;

    if (!shortUrl) {
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        shortUrl = generateShortUrl();
        const existing = await URL.findOne({
          $or: [{ shortUrl }, { customShortUrl: shortUrl }],
        });

        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique) {
        return res.status(500).json({
          success: false,
          message: "Unable to generate unique short URL. Please try again.",
        });
      }
    }

    // ============= HASH PASSWORD IF PROVIDED =============
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // ============= GENERATE QR CODE IF REQUESTED =============
    let qrImageUrl = null;
    let hasQR = false;

    if (generateQR) {
      try {
        const fullShortUrl = `${process.env.BASE_URL}/${shortUrl}`;
        qrImageUrl = await generateQRCode(fullShortUrl);
        hasQR = true;
      } catch (qrError) {
        console.error("QR generation failed:", qrError);
      }
    }

    // ============= FETCH METADATA FROM LONG URL =============
    let fetchedTitle = title;
    let fetchedDescription = description;
    let fetchedImage = image;

    if (!title || !description || !image) {
      try {
        const metadata = await fetchUrlMetadata(longUrl);
        fetchedTitle = title || metadata.title || "Untitled Link";
        fetchedDescription = description || metadata.description || "";
        fetchedImage = image || metadata.image || "";
      } catch (metaError) {
        console.error("Metadata fetch failed:", metaError);
        fetchedTitle = title || "Untitled Link";
        fetchedDescription = description || "";
        fetchedImage = image || "";
      }
    }

    // ============= CREATE URL DOCUMENT =============
    const newUrl = new URL({
      owner,
      title: fetchedTitle,
      description: fetchedDescription,
      longUrl: longUrl.trim(),
      shortUrl,
      customShortUrl: customShortUrl ? customShortUrl : undefined,
      collection: collection || null,
      password: hashedPassword,
      expiry: expiry || null,
      image: fetchedImage,
      tags: tags || [],
      notes: notes || "",
      hasQR,
      qrImageUrl,
      clickCount: 0,
      uniqueVisitors: 0,
      lastClickedAt: null,
      isActive: true,
      lastChecked: new Date(),
      httpStatus: null,
    });

    await newUrl.save();

    // ============= INITIALIZE ANALYTICS DOCUMENT =============
    const analytics = new Analytics({
      urlId: newUrl._id,
      owner,
      totalClicks: 0,
      uniqueVisitors: 0,
      clicksByDate: [],
      clicksByHour: Array(24).fill(0),
      clicksByDay: Array(7).fill(0),
      deviceBreakdown: {
        mobile: 0,
        desktop: 0,
        tablet: 0,
        other: 0,
      },
      browserBreakdown: new Map(),
      osBreakdown: new Map(),
      countryBreakdown: new Map(),
      cityBreakdown: new Map(),
      referrerBreakdown: new Map(),
      uniqueVisitorIds: []
    });

    await analytics.save();

    // ============= UPDATE COLLECTION IF PROVIDED =============
    if (collectionDoc) {
      await collectionDoc.addLink(newUrl._id);
    }

    // ============= RETURN SUCCESS RESPONSE =============
    const response = {
      success: true,
      message: "Short URL created successfully",
      data: {
        _id: newUrl._id,
        title: newUrl.title,
        description: newUrl.description,
        longUrl: newUrl.longUrl,
        shortUrl: newUrl.shortUrl,
        customShortUrl: newUrl.customShortUrl,
        fullShortUrl: `${process.env.BASE_URL}/${newUrl.shortUrl}`,
        collection: newUrl.collection,
        hasPassword: !!hashedPassword,
        expiry: newUrl.expiry,
        image: newUrl.image,
        tags: newUrl.tags,
        qrCodeUrl: newUrl.qrImageUrl,
        createdAt: newUrl.createdAt,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating short URL:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `This ${field} is already in use`,
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating short URL",
    });
  }
};

export const createBulkShortUrls = async (req, res) => {
  try {
    const { urls, collection, tags } = req.body;
    const owner = req.user.userId;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of URLs",
      });
    }

    if (urls.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 URLs allowed per batch",
      });
    }

    // Validate collection if provided
    let collectionDoc = null;
    if (collection) {
      collectionDoc = await Collection.findOne({
        _id: collection,
        owner: owner,
      });

      if (!collectionDoc) {
        return res.status(404).json({
          success: false,
          message: "Collection not found or you don't have access",
        });
      }
    }

    const createdUrls = [];
    const errors = [];

    for (const longUrl of urls) {
      try {
        if (!longUrl || typeof longUrl !== 'string') continue;

        // Generate unique short URL
        let shortUrl;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          shortUrl = generateShortUrl();
          const existing = await URL.findOne({
            $or: [{ shortUrl }, { customShortUrl: shortUrl }],
          });
          if (!existing) isUnique = true;
          else attempts++;
        }

        if (!isUnique) {
          errors.push({ url: longUrl, error: "Failed to generate unique code" });
          continue;
        }

        // Fetch metadata
        let fetchedTitle = "Untitled Link";
        let fetchedDescription = "";
        let fetchedImage = "";

        try {
          const metadata = await fetchUrlMetadata(longUrl);
          fetchedTitle = metadata.title || "Untitled Link";
          fetchedDescription = metadata.description || "";
          fetchedImage = metadata.image || "";
        } catch (metaError) {
          console.warn(`Metadata fetch failed for ${longUrl}:`, metaError);
        }

        // Create URL document
        const newUrl = new URL({
          owner,
          title: fetchedTitle,
          description: fetchedDescription,
          image: fetchedImage,
          longUrl: longUrl.trim(),
          shortUrl,
          collection: collection || null,
          tags: tags || [],
          isActive: true,
          clickCount: 0,
          uniqueVisitors: 0,
          lastChecked: new Date(),
        });

        await newUrl.save();

        // Initialize Analytics
        const analytics = new Analytics({
          urlId: newUrl._id,
          owner,
          totalClicks: 0,
          uniqueVisitors: 0,
          clicksByDate: [],
          clicksByHour: Array(24).fill(0),
          clicksByDay: Array(7).fill(0),
          deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, other: 0 },
          browserBreakdown: new Map(),
          osBreakdown: new Map(),
          countryBreakdown: new Map(),
          cityBreakdown: new Map(),
          referrerBreakdown: new Map(),
          uniqueVisitorIds: []
        });

        await analytics.save();
        createdUrls.push(newUrl);

      } catch (err) {
        console.error(`Error creating URL for ${longUrl}:`, err);
        errors.push({ url: longUrl, error: err.message });
      }
    }

    // Add to collection
    if (collectionDoc && createdUrls.length > 0) {
      for (const url of createdUrls) {
        await collectionDoc.addLink(url._id);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdUrls.length} URLs`,
      data: {
        created: createdUrls,
        errors: errors.length > 0 ? errors : undefined,
        count: createdUrls.length
      }
    });

  } catch (error) {
    console.error("Bulk creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk creation",
    });
  }
};

// Editing the created URL 
export const updateShortUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      longUrl,
      customShortUrl,
      expiry,
      password,
      tags,
      notes,
      collection,
      image,
    } = req.body;

    const userId = req.user.userId;

    const existingUrl = await URL.findOne({ _id: id, owner: userId });
    if (!existingUrl) {
      return res.status(404).json({
        success: false,
        message: "URL not found or unauthorized",
      });
    }

    if (expiry && new Date(expiry) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be in the future",
      });
    }

    if (customShortUrl && customShortUrl !== existingUrl.customShortUrl) {
      const customUrlRegex = /^[a-zA-Z0-9-_]+$/;
      if (!customUrlRegex.test(customShortUrl)) {
        return res.status(400).json({
          success: false,
          message:
            "Custom URL can only contain letters, numbers, hyphens, and underscores",
        });
      }

      const customTaken = await URL.findOne({
        $or: [{ shortUrl: customShortUrl }, { customShortUrl }],
      });

      if (customTaken) {
        return res.status(400).json({
          success: false,
          message: "This custom URL is already taken",
        });
      }

      existingUrl.customShortUrl = customShortUrl;
      existingUrl.shortUrl = customShortUrl;
    }

    if (longUrl && longUrl !== existingUrl.longUrl) {
      existingUrl.longUrl = longUrl;

      try {
        const meta = await fetchUrlMetadata(longUrl);
        existingUrl.title = title || meta.title || existingUrl.title;
        existingUrl.description =
          description || meta.description || existingUrl.description;
        existingUrl.image = meta.image || existingUrl.image;
      } catch (err) {
        console.warn("Metadata fetch failed on update");
      }
    } else {
      if (title) existingUrl.title = title;
      if (description) existingUrl.description = description;
      if (image !== undefined) existingUrl.image = image;
    }

    if (expiry) existingUrl.expiry = expiry;
    if (tags) existingUrl.tags = tags;
    if (notes) existingUrl.notes = notes;

    if (collection && collection !== existingUrl.collection?.toString()) {
      const collectionExists = await Collection.findOne({
        _id: collection,
        owner: userId,
      });

      if (!collectionExists) {
        return res.status(404).json({
          success: false,
          message: "Target collection not found",
        });
      }

      await Collection.findByIdAndUpdate(existingUrl.collection, {
        $pull: { links: existingUrl._id },
      });

      await Collection.findByIdAndUpdate(collection, {
        $push: { links: existingUrl._id },
      });

      existingUrl.collection = collection;
    }

    if (password) {
      existingUrl.password = await bcrypt.hash(password, 10);
    }

    await existingUrl.save();

    res.json({
      success: true,
      message: "Short URL updated successfully",
      data: existingUrl,
    });
  } catch (err) {
    console.error("Error updating URL:", err);
    res.status(500).json({
      success: false,
      message: "Server error updating short URL",
    });
  }
};

// Delete existing URL 
export const deleteShortUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const url = await URL.findOne({ _id: id, owner: userId });
    if (!url) {
      return res.status(404).json({
        success: false,
        message: "URL not found or unauthorized",
      });
    }

    // Remove from collection if exists
    if (url.collection) {
      const collection = await Collection.findById(url.collection);
      if (collection) {
        await collection.removeLink(url._id);
      }
    }

    // Delete URL and analytics
    await URL.deleteOne({ _id: id });
    await Analytics.deleteOne({ urlId: id });

    res.json({
      success: true,
      message: "Short URL deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting URL:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting short URL",
    });
  }
};

// Moving URL to a Collection
export const moveUrlToCollection = async (req, res) => {
  try {
    const { id } = req.params; // URL ID
    const { collectionId } = req.body; // New collection ID
    const userId = req.user.userId;

    const url = await URL.findOne({ _id: id, owner: userId });
    if (!url) {
      return res.status(404).json({
        success: false,
        message: "URL not found or unauthorized",
      });
    }

    // Remove from old collection
    if (url.collection) {
      const oldCollection = await Collection.findById(url.collection);
      if (oldCollection) {
        await oldCollection.removeLink(url._id);
      }
    }

    // Add to new collection
    if (collectionId) {
      const newCollection = await Collection.findOne({
        _id: collectionId,
        owner: userId,
      });

      if (!newCollection) {
        return res.status(404).json({
          success: false,
          message: "Target collection not found",
        });
      }

      await newCollection.addLink(url._id);
      url.collection = collectionId;
    } else {
      url.collection = null;
    }

    await url.save();

    res.json({
      success: true,
      message: "URL moved successfully",
      data: url,
    });
  } catch (err) {
    console.error("Error moving URL:", err);
    res.status(500).json({
      success: false,
      message: "Server error moving URL",
    });
  }
};
