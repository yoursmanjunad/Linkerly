import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper function to generate token and set cookie
const generateTokenAndSetCookie = (userId, userName, res) => {
    const token = jwt.sign(
        { userId, userName },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    // Set HTTP-only cookie
    res.cookie("token", token, {
        httpOnly: true, // Prevents XSS attacks
        secure: false, // HTTPS only in production
        sameSite: "lax", // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    return token;
};

export const registerUser = async (req, res) => {
    try {
        const { userName, email, password, firstName, lastName, bio } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            userName,
            email,
            password: hashedPassword,
            firstName,
            lastName, 
            bio
        });
        await newUser.save();

        // Optional: Auto-login after registration
        const token = generateTokenAndSetCookie(newUser._id, newUser.userName, res);

        res.status(201).json({ 
            message: "User registered successfully",
            token, // Still send token for clients that prefer it
            user: {
                id: newUser._id,
                userName: newUser.userName,
                email: newUser.email,
                firstName: newUser.firstName
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { userName, password } = req.body;
        
        const user = await User.findOne({ userName });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const token = generateTokenAndSetCookie(user._id, user.userName, res);

        res.status(200).json({ 
            token, // Still send token for clients that prefer it
            message: "Login successful",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                firstName: user.firstName
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const logoutUser = async (req, res) => {
    try {
        // Clear the cookie
        res.cookie("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0 // Expire immediately
        });

        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by auth middleware
        const user = await User.findById(req.user.userId).select("-password");
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateAccountDetails = async (req, res) => {
    try {
        const { firstName, lastName, bio, profilePicUrl, socialLinks } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (bio !== undefined) user.bio = bio;
        if (profilePicUrl !== undefined) user.profilePicUrl = profilePicUrl;
        if (socialLinks !== undefined) user.socialLinks = socialLinks;

        await user.save();

        res.status(200).json({
            message: "Account updated successfully",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                profilePicUrl: user.profilePicUrl,
                socialLinks: user.socialLinks
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const changeCurrentPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid old password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const toggleBookmark = async (req, res) => {
    try {
        const { collectionId } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const index = user.bookmarks.indexOf(collectionId);
        if (index === -1) {
            // Add bookmark
            user.bookmarks.push(collectionId);
            await user.save();
            res.status(200).json({ message: "Collection bookmarked", isBookmarked: true });
        } else {
            // Remove bookmark
            user.bookmarks.splice(index, 1);
            await user.save();
            res.status(200).json({ message: "Bookmark removed", isBookmarked: false });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};