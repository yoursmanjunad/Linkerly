import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    try {
        // Check for token in cookie first, then fallback to Authorization header
        let token = req.cookies.token;
        
        // Fallback to Authorization header if no cookie
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            userName: decoded.userName
        };

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};