import cookieParser from "cookie-parser";
import express from "express";
import { userRouter } from "./routes/user.routes.js";
import urlRoutes from "./routes/url.routes.js";
import { redirectShortUrl } from "./controllers/redirect.controllers.js";
import collectionRoutes from "./routes/collections.routes.js";
import { getPublicCollection } from "./controllers/collections.controllers.js";
import uploadRoutes from "./routes/upload.routes.js";
import bookmarkRoutes from "./routes/bookmarks.routes.js";
import reportRoutes from "./routes/report.routes.js";
import cors from "cors";
import profileRoutes from "./routes/profile.routes.js";
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: true, // Allow all origins (including extension)
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Routes
// ✅ 1. Define all /api routes first
app.use("/api/users", userRouter);
app.use("/api/url", urlRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", bookmarkRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/profiles", profileRoutes);

// ✅ 2. Add your public collection route before short URL redirect
app.get("/public/:slug", getPublicCollection);

// ✅ 3. (Optional but recommended) also support cleaner short form like /c/:slug
app.get("/c/:slug", getPublicCollection);

// ✅ 4. Keep this LAST — catches all short URLs like /abc123
app.get("/:shortUrl", redirectShortUrl);




export { app };
