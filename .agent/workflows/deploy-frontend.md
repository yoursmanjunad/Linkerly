---
description: Deploy the frontend to Vercel
---

This guide explains how to deploy the Linkerly frontend to Vercel.

## Prerequisites
- A Vercel account (https://vercel.com)
- The project pushed to GitHub (https://github.com/yoursmanjunad/Linkerly)

## Steps

1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Add New Project**:
    - Click on "Add New..." -> "Project".
    - Select "Continue with GitHub".
    - Find the `Linkerly` repository and click "Import".

3.  **Configure Project**:
    - **Project Name**: You can leave it as `Linkerly` or change it.
    - **Framework Preset**: Vercel should automatically detect `Next.js`.
    - **Root Directory**:
        - Click "Edit" next to Root Directory.
        - Select the `frontend` folder.
        - This is crucial because your Next.js app lives inside the `frontend` subdirectory, not the root.

4.  **Environment Variables**:
    - Expand the "Environment Variables" section.
    - Add the following variables (match the values from your local `.env` file, but point to your production backend):
        - `NEXT_PUBLIC_API_URL`: Your production backend API URL (e.g., `https://your-backend-api.com/api`).
        - `NEXT_PUBLIC_SHORT_BASE_URL`: Your production short URL base (e.g., `https://linkerly.it`).

5.  **Deploy**:
    - Click "Deploy".
    - Vercel will build your application.
    - Once finished, you will get a production URL (e.g., `linkerly-frontend.vercel.app`).

## Troubleshooting
- **Build Fails**: Check the build logs. Ensure `npm run build` runs successfully locally.
- **API Issues**: Ensure your `NEXT_PUBLIC_API_URL` is correct and your backend allows CORS from your Vercel domain.
