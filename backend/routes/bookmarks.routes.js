// routes/bookmarks.routes.js
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { toggleBookmark, getBookmarks } from "../controllers/bookmarks.controllers.js";
const router = Router();

router.post("/collections/:id/bookmark", authMiddleware, toggleBookmark);
router.get("/users/bookmarks", authMiddleware, getBookmarks);

export default router;
