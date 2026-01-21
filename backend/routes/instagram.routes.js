import { Router } from "express";
import {
  initiateInstagramAuth,
  handleInstagramCallback,
  getInstagramBackup
} from "../controllers/instagram.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const instagramRouter = Router();

// Start the auth flow - requires user to be logged in to app
instagramRouter.get("/auth", authMiddleware, initiateInstagramAuth);

// Callback from Instagram - public route, but validates state
instagramRouter.get("/callback", handleInstagramCallback);

// Get the backed up data - requires user to be logged in
instagramRouter.get("/backup", authMiddleware, getInstagramBackup);

export { instagramRouter };
