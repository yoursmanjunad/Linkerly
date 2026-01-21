import mongoose from "mongoose";

const instagramBackupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // One backup per user
  },
  instagramId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true,
    select: false // Don't return by default
  },
  media: [
    {
      id: String,
      caption: String,
      media_type: String, // IMAGE, VIDEO, CAROUSEL_ALBUM
      media_url: String,
      permalink: String,
      timestamp: Date,
      thumbnail_url: String // For videos
    }
  ],
  lastBackupAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export const InstagramBackup = mongoose.model("InstagramBackup", instagramBackupSchema);
