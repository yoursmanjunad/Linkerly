// controllers/profile.controller.js
import { User } from "../models/user.models.js";
import { Collection } from "../models/collections.models.js";
import mongoose from "mongoose";

/**
 * GET /api/profiles/:username
 * Public: returns user profile + public collections (paginated)
 * Query params:
 *   - page (default 1)
 *   - limit (default 12)
 */
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(parseInt(req.query.limit || "12"), 48);
    const skip = (page - 1) * limit;

    // Find user by username (case-insensitive)
    const user = await User.findOne({ userName: username.toLowerCase() }).select(
      "userName firstName lastName profilePicUrl bio socialLinks"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get public collections owned by this user (paginated)
    const [collections, total] = await Promise.all([
      Collection.find({ owner: user._id, isPublic: true })
        .select("name slug image linkCount collectionShortUrl description createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Collection.countDocuments({ owner: user._id, isPublic: true }),
    ]);

    return res.json({
      success: true,
      data: {
        user: {
          userName: user.userName,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicUrl: user.profilePicUrl || null,
          bio: user.bio || "",
          socialLinks: user.socialLinks || [],
        },
        collections,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + collections.length < total,
        },
      },
    });
  } catch (err) {
    console.error("getPublicProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/profiles/:username/collections
 * Optional: return collections only (public)
 */
export const getPublicCollections = async (req, res) => {
  try {
    const { username } = req.params;
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(parseInt(req.query.limit || "12"), 48);
    const skip = (page - 1) * limit;

    const user = await User.findOne({ userName: username.toLowerCase() }).select("_id");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const [collections, total] = await Promise.all([
      Collection.find({ owner: user._id, isPublic: true })
        .select("name slug image linkCount collectionShortUrl description createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Collection.countDocuments({ owner: user._id, isPublic: true }),
    ]);

    res.json({
      success: true,
      data: { collections, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (err) {
    console.error("getPublicCollections error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PUT /api/profiles/me
 * Protected: update current logged-in user's profile
 * Body can include: profilePicUrl, bio, socialLinks (array of {platform,url}), firstName, lastName
 */
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid user" });

    const updatable = {};
    const { profilePicUrl, bio, socialLinks, firstName, lastName } = req.body;

    if (profilePicUrl !== undefined) updatable.profilePicUrl = profilePicUrl;
    if (bio !== undefined) updatable.bio = bio;
    if (firstName !== undefined) updatable.firstName = firstName;
    if (lastName !== undefined) updatable.lastName = lastName;
    if (Array.isArray(socialLinks)) {
      // Validate minimal shape
      updatable.socialLinks = socialLinks.map((s) => ({
        platform: String(s.platform || "").trim(),
        url: String(s.url || "").trim(),
      }));
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updatable }, { new: true }).select(
      "userName firstName lastName profilePicUrl bio socialLinks"
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: {
        user: {
          userName: user.userName,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicUrl: user.profilePicUrl,
          bio: user.bio,
          socialLinks: user.socialLinks || [],
        },
      },
    });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


