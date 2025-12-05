---
description: Deploy the backend to Render
---

This guide explains how to deploy the Linkerly backend to Render.com.

## Prerequisites
- A Render account (https://render.com)
- The project pushed to GitHub (https://github.com/yoursmanjunad/Linkerly)
- A MongoDB Atlas cluster (or another cloud MongoDB provider)

## Steps

1.  **Log in to Render**: Go to [render.com](https://render.com) and log in.
2.  **Create New Web Service**:
    - Click "New +" and select "Web Service".
    - Connect your GitHub account if you haven't already.
    - Select the `Linkerly` repository.

3.  **Configure Service**:
    - **Name**: `linkerly-backend` (or similar).
    - **Region**: Choose a region close to your users (and ideally close to your DB).
    - **Branch**: `main`.
    - **Root Directory**: `backend` (Important! Your backend code is in this subfolder).
    - **Runtime**: `Node`.
    - **Build Command**: `npm install` (Render usually detects this).
    - **Start Command**: `npm start` (We added this script to your package.json).

4.  **Environment Variables**:
    - Scroll down to "Environment Variables".
    - Add the keys and values from your local `backend/.env` file. Common ones include:
        - `PORT`: `8000` (or leave blank, Render sets a PORT env var, but your code should respect `process.env.PORT`).
        - `MONGODB_URI`: Your production MongoDB connection string (e.g., from MongoDB Atlas).
        - `CORS_ORIGIN`: The URL of your deployed frontend (e.g., `https://linkerly-frontend.vercel.app`).
        - `ACCESS_TOKEN_SECRET`: A strong, random string.
        - `REFRESH_TOKEN_SECRET`: A strong, random string.
        - `ACCESS_TOKEN_EXPIRY`: e.g., `1d`.
        - `REFRESH_TOKEN_EXPIRY`: e.g., `10d`.
        - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: If using Cloudinary.
        - `NODE_ENV`: `production`.

5.  **Deploy**:
    - Click "Create Web Service".
    - Render will start building and deploying your backend.
    - Once successful, you will see a "Live" status and your backend URL (e.g., `https://linkerly-backend.onrender.com`).

## Post-Deployment
- **Update Frontend**: Once you have the backend URL, go back to your Vercel project settings for the frontend.
- Update the `NEXT_PUBLIC_API_URL` environment variable to point to your new Render backend URL (e.g., `https://linkerly-backend.onrender.com/api/v1`).
- Redeploy the frontend on Vercel for the changes to take effect.
