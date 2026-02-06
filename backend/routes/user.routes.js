import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateAccountDetails,
  changeCurrentPassword,
  toggleBookmark,
  requestPasswordReset,
  resetPassword
} from "../controllers/user.controllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/profile", authMiddleware, getCurrentUser);
userRouter.put("/update-account", authMiddleware, updateAccountDetails);
userRouter.post("/change-password", authMiddleware, changeCurrentPassword);
userRouter.post("/toggle-bookmark", authMiddleware, toggleBookmark);
userRouter.post("/forgot-password", requestPasswordReset);
userRouter.post("/reset-password", resetPassword);


export { userRouter };
