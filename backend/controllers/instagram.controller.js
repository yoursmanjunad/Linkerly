import { InstagramBackup } from "../models/instagram.models.js";
import { User } from "../models/user.models.js";

// Helper to get env vars
const getInstagramConfig = () => {
  return {
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:5000/api/instagram/callback",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
  };
};

export const initiateInstagramAuth = async (req, res) => {
  try {
    const { clientId, redirectUri } = getInstagramConfig();
    
    // We can pass userId in state to verify on callback if needed, 
    // but we'll rely on authMiddleware for the callback for now.
    // However, for better security and flow, let's encode userId in state.
    const state = Buffer.from(JSON.stringify({ userId: req.user.userId })).toString('base64');

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=${state}`;

    res.json({ authUrl });
  } catch (error) {
    console.error("Instagram Auth Error:", error);
    res.status(500).json({ message: "Failed to initiate Instagram auth" });
  }
};

export const handleInstagramCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const { clientId, clientSecret, redirectUri, frontendUrl } = getInstagramConfig();

    if (!code) {
      return res.redirect(`${frontendUrl}/dashboard?error=instagram_auth_failed`);
    }

    // Decode state to get userId if we want to double check or if cookie is missing
    let userId;
    try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decodedState.userId;
    } catch (e) {
        console.error("Invalid state param", e);
        // If state is invalid, we might still fall back to req.user if authMiddleware worked
        // But for this flow, let's assume state is required to link correctly
        return res.redirect(`${frontendUrl}/dashboard?error=invalid_state`);
    }

    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code
    });

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenParams
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error_message || !tokenData.access_token) {
      console.error("Instagram Token Error:", tokenData);
      return res.redirect(`${frontendUrl}/dashboard?error=instagram_token_failed`);
    }

    const accessToken = tokenData.access_token;
    const instagramUserId = tokenData.user_id;

    // 2. Fetch User Profile
    const profileResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const profileData = await profileResponse.json();

    // 3. Fetch User Media
    const mediaResponse = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${accessToken}`);
    const mediaData = await mediaResponse.json();

    // 4. Save/Update to DB
    await InstagramBackup.findOneAndUpdate(
      { userId: userId },
      {
        userId: userId,
        instagramId: profileData.id || instagramUserId,
        username: profileData.username,
        accessToken: accessToken,
        media: mediaData.data || [],
        lastBackupAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.redirect(`${frontendUrl}/dashboard?instagram_connected=true`);

  } catch (error) {
    console.error("Instagram Callback Error:", error);
    const { frontendUrl } = getInstagramConfig();
    res.redirect(`${frontendUrl}/dashboard?error=server_error`);
  }
};

export const getInstagramBackup = async (req, res) => {
  try {
    const backup = await InstagramBackup.findOne({ userId: req.user.userId }).select("-accessToken");
    
    if (!backup) {
      return res.status(404).json({ message: "No Instagram backup found" });
    }

    res.json(backup);
  } catch (error) {
    console.error("Get Backup Error:", error);
    res.status(500).json({ message: "Failed to fetch backup" });
  }
};
