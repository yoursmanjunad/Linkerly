import express from "express";
import { imagekit } from "../config/imagekit.js";

const router = express.Router();

router.get("/signature", async (req, res) => {
  try {
    const result = imagekit.getAuthenticationParameters();
    res.json(result);
  } catch (err) {
    console.error("ImageKit signature error:", err);
    res.status(500).json({ message: "Failed to generate signature" });
  }
});

export default router;
