import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createCollection,
  getUserCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addUrlToCollection,
  removeUrlFromCollection,
  getCollectionAnalytics,
  getPublicCollection,
  moveUrlToCollection,
  bulkAddUrlsToCollection,
  bookmarkCollection
} from "../controllers/collections.controllers.js";

const collectionRoutes = Router();

// ============= PROTECTED ROUTES =============

// Create new collection
collectionRoutes.post("/", authMiddleware, createCollection);

// Get all collections for user
collectionRoutes.get("/", authMiddleware, getUserCollections);

// Get single collection by ID
collectionRoutes.get("/:id", authMiddleware, getCollectionById);

// Update collection
collectionRoutes.put("/:id", authMiddleware, updateCollection);

// Delete collection
collectionRoutes.delete("/:id", authMiddleware, deleteCollection);

// Add URL to collection
collectionRoutes.post("/:id/urls", authMiddleware, addUrlToCollection);

// Bulk add URLs to collection
collectionRoutes.post("/:id/urls/bulk", authMiddleware, bulkAddUrlsToCollection);

// Remove URL from collection
collectionRoutes.delete("/:id/urls/:urlId", authMiddleware, removeUrlFromCollection);

// Move URL to different collection
collectionRoutes.put("/:id/urls/move", authMiddleware, moveUrlToCollection);

// Get collection analytics
collectionRoutes.get("/:id/analytics", authMiddleware, getCollectionAnalytics);

// Toggle bookmark
collectionRoutes.post("/:id/bookmark", authMiddleware, bookmarkCollection);

// ============= PUBLIC ROUTES =============

// Get public collection by slug
collectionRoutes.get("/public/:slug", getPublicCollection);

export default collectionRoutes;