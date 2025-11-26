import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { 
  createShortUrl, 
  createBulkShortUrls,
  updateShortUrl, 
  deleteShortUrl,
  getUrlMetadata,
  generateQrCodeEndpoint,
} from "../controllers/url.controllers.js";
import { getUserUrls, getUrlAnalytics, getUrlDetails, getUserStats, getUserAnalytics } from "../controllers/analytics.controllers.js";

const urlRoutes = Router();

// ============= PROTECTED ROUTES (Auth required) =============

// Create new short URL
urlRoutes.post("/shorten", authMiddleware, createShortUrl);

// Bulk create short URLs
urlRoutes.post("/shorten/bulk", authMiddleware, createBulkShortUrls);

// Get URL metadata
urlRoutes.post("/metadata", authMiddleware, getUrlMetadata);

// Generate QR Code
urlRoutes.get("/qrcode", generateQrCodeEndpoint);

// Get all URLs for authenticated user
urlRoutes.get("/user/links", authMiddleware, getUserUrls);

// Get user aggregated stats
urlRoutes.get("/user/stats", authMiddleware, getUserStats);

// Get user detailed analytics
urlRoutes.get("/user/analytics", authMiddleware, getUserAnalytics);

// Get specific URL details
urlRoutes.get("/details/:id", authMiddleware, getUrlDetails);

// Get analytics for specific URL
urlRoutes.get("/analytics/:id", authMiddleware, getUrlAnalytics);

// Update existing URL
urlRoutes.put("/update/:id", authMiddleware, updateShortUrl);

// Delete URL
urlRoutes.delete("/delete/:id", authMiddleware, deleteShortUrl);

export default urlRoutes;