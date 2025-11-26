// controllers/bookmarks.controller.js
import { User } from "../models/user.models.js";
import { Collection } from "../models/collections.models.js";

export const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: collectionId } = req.params;

    const collection = await Collection.findById(collectionId);
    if (!collection) return res.status(404).json({ success: false, message: "Collection not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const exists = user.bookmarks?.some(b => b.toString() === collectionId);
    if (exists) {
      user.bookmarks = user.bookmarks.filter(b => b.toString() !== collectionId);
    } else {
      user.bookmarks = user.bookmarks || [];
      user.bookmarks.push(collectionId);
    }
    await user.save();
    res.json({ success: true, bookmarked: !exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error toggling bookmark" });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate({
      path: "bookmarks",
      select: "name slug description image links"
    });
    res.json({ success: true, data: user?.bookmarks || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error getting bookmarks" });
  }
};
