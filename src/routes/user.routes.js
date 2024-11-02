import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserId,
  searchUsers,
  sendMessageRequest,
  getNotifications,
  acceptMessageRequest,
  getConnectedUsers,
  sendMessage,
  getPreviousMessages
} from "../controllers/user.controller.js";


const router = Router();

//Authentication Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Fetching Current (logged in) User ID
router.get("/getUserId", getUserId);


// Route to Search Users by Username
router.get("/search", searchUsers);

//Send & Accept Message Requests
router.post("/message-request", sendMessageRequest);
router.post("/accept-message-request", acceptMessageRequest);
router.get("/notifications/:username", getNotifications);

//Fetching Connected Users of The Current Logged In User
router.get("/getConnectedUsers/:loggedInUserUsername", getConnectedUsers);

// Sending Private Messages
router.post("/send-message", sendMessage);
router.get("/get-previous-messages/:currentUser/:chatWithUser", getPreviousMessages);

export default router;
