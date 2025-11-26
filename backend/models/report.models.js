import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['spam', 'phishing', 'malware', 'inappropriate', 'other']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  reporterEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  ipAddress: {
    type: String
  }
}, { timestamps: true });

export const Report = mongoose.model("Report", reportSchema);
