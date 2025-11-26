// routes/profile.routes.js
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getPublicCollections, getPublicProfile, updateMyProfile } from "../controllers/profile.controllers.js";
// import {
//   getPublicProfile,
//   getPublicCollections,
//   updateMyProfile,
// } from "../controllers/profile.controller.js";

const router = Router();

// Public profile page (user + public collections)
router.get("/:username", getPublicProfile);

// Public collections only (optional pagination)
router.get("/:username/collections", getPublicCollections);

// Update own profile (protected)
router.put("/me", authMiddleware, updateMyProfile);
router.get("/me", authMiddleware, getPublicProfile);
export default router;
