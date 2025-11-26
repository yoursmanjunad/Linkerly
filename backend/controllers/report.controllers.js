import { Report } from "../models/report.models.js";

export const createReport = async (req, res) => {
  try {
    const { url, reason, description, email } = req.body;
    
    if (!url || !reason) {
      return res.status(400).json({ message: "URL and reason are required" });
    }

    const report = new Report({
      url,
      reason,
      description,
      reporterEmail: email,
      ipAddress: req.ip
    });

    await report.save();

    res.status(201).json({ 
      success: true, 
      message: "Report submitted successfully. We will review it shortly." 
    });
  } catch (error) {
    console.error("Report submission error:", error);
    res.status(500).json({ message: "Failed to submit report" });
  }
};
