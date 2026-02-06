import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password:{
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  profilePicUrl: String,
  bio: { type: String, default: "" }, // for public page
  socialLinks: [
    {
      platform: String,
      url: String
    }
  ],
   bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Collection" }],
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpiresAt: {
    type: Date,
    select: false
  }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
