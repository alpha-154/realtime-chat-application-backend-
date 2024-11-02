import User from "../models/user.model.js";
import Publickey from "../models/publickey.model.js";
import Message from "../models/message.model.js";
import PrivateMessage from "../models/privatemessage.model.js";
import jwt from "jsonwebtoken";
import userRegisterSchema from "../schemas/userRegister.schema.js";
import userLoginSchema from "../schemas/userLogin.schema.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

//Todo: add zod validation as such so that a user have to provide strong password.


// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });


export const registerUser = async (req, res) => {
    const result = userRegisterSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ message: result.error.issues[0].message });
        return;
    }
     const { userName, password, imageUrl } = result.data;
    try {
        if (!userName || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const hashPassword = await bcrypt.hash(password, 10);
        // Generate public and private key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048, // Key size in bits, 2048 is common for secure RSA
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        //Todo: encrypt the private key with the user's password & then store it into database
        const createdAt = new Date().toISOString().split('T')[0]; // Format the date to YYYY-MM-DD
        const newUser = new User({
            publicKey,
            privateKey,
            userName,
            password: hashPassword,
            profileImage: imageUrl || "",  
            createdAt
        });
        await newUser.save();
        // Save public key and username to Publickey model
        const publicKeyEntry = new Publickey({
            userName,
            publicKey,
        });
        await publicKeyEntry.save();
        res
            .status(201)
            .json({ message: "User created successfully", user: newUser });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error!" });
    }
};
export const loginUser = async (req, res) => {
    const result = userLoginSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ message: result.error.issues[0].message });
        return;
    }
    const { userName, password } = result.data;
   // console.log("usernName, password ", userName, password)
    try {
        // Check if both fields are provided
        if (!userName || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }
        // Check if the user exists
        const user = await User.findOne({ userName });
        if (!user) {
            res.status(400).json({ message: "User doesn't exist" });
            return;
        }
        // Validate the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        // Generate a JWT token
        const token = jwt.sign({ _id: user._id , username: user.userName, profileImage: user.profileImage }, process.env.JWT_SECRET, {
            expiresIn: "1h", // Set token expiration as needed
        });
        // Send token as an HTTP-only cookie
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Send securely only in production
            maxAge: 60 * 60 * 1000, // Token expiry in ms
        });
        res.status(200).json({ message: "Logged in successfully", user: { userName: user.userName, publicKey: user.publicKey } });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error!" });
    }
};


export const logoutUser = async (req, res) => {
    try {
        // Clear the accessToken cookie
        res.cookie("accessToken", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: new Date(0),  // Expire the cookie immediately
            path: "/",  // Ensure cookie is cleared site-wide
        });

        // Set headers to disable caching
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");

        res.status(200).json({
            message: "Logout successful",
            success: true,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error!",
            error: error.message,
        });
    }
};


export const getUserId = (req, res) => {
    const token = req.cookies.accessToken; // Access the token from cookies
  
    if (!token) {
      return res.status(401).json({ error: 'No token found' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use the same secret used to sign the token
      const userId = decoded._id; // Assuming _id is part of the token payload
  
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }
      const username = decoded.username
      if(!username){
        return res.status(401).json({ error: 'Username not found in token' });
      }
      const profileImage = decoded.profileImage
      if(!profileImage){
        return res.status(401).json({ error: 'Profile image not found in token' });
      }
  
      return res.status(200).json({ userId , username , profileImage});
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };




export const sendMessageRequest = async (req, res) => {
    const { sender, receiver } = req.body;
    if (!sender || !receiver) {
        return res.status(400).json({ message: "Sender or Receiver fields not found!" });
    }

    try {
        const senderUser = await User.findOne({ userName: sender });
        const receiverUser = await User.findOne({ userName: receiver });

        if (!senderUser || !receiverUser) {
            return res.status(404).json({ message: "Users not found!" });
        }

        // Prevent self-request
        if (senderUser._id.equals(receiverUser._id)) {
            return res.status(400).json({ message: "Cannot send a message request to yourself!" });
        }

        // Add message request if it does not already exist
        const result = await User.findByIdAndUpdate(
            receiverUser._id,
            { $addToSet: { messageRequest: senderUser._id } }, // Only add if not already in messageRequest
            { new: true }
        );

        if (!result) {
            return res.status(400).json({ message: "Message request already sent!" });
        }

        res.status(200).json({ message: "Message request sent successfully!" });
    } catch (error) {
        console.error("Error sending message request:", error);
        return res.status(500).json({ message: "Internal server error!" });
    }
};




export const acceptMessageRequest = async (req, res) => {
    const { currentUser, requestedUser } = req.body;
    if (!currentUser || !requestedUser) {
        return res.status(400).json({ message: "Sender or Receiver fields not found!" });
    }

    try {
        const currentUserData = await User.findOne({ userName: currentUser });
        const requestedUserData = await User.findOne({ userName: requestedUser });

        if (!currentUserData || !requestedUserData) {
            return res.status(404).json({ message: "Users not found!" });
        }

        // Prevent self-request acceptance
        if (currentUserData._id.equals(requestedUserData._id)) {
            return res.status(400).json({ message: "Cannot accept your own message request!" });
        }

        // Add each user to the other’s friend list if not already present and remove the message request
        await User.updateOne(
            { _id: currentUserData._id },
            {
                $addToSet: { friendList: requestedUserData._id },
                $pull: { messageRequest: requestedUserData._id }, // Remove request once accepted
            }
        );
        await User.updateOne(
            { _id: requestedUserData._id },
            { $addToSet: { friendList: currentUserData._id } }
        );

        // Check if a PrivateMessage document already exists between these users
        let privateMessage = await PrivateMessage.findOne({
            members: { $all: [currentUserData._id, requestedUserData._id] },
        });

        if (!privateMessage) {
            // Create new PrivateMessage document if it doesn’t exist
            privateMessage = new PrivateMessage({
                members: [currentUserData._id, requestedUserData._id],
            });
            await privateMessage.save();
        }


        //newly added code: 
        await User.updateOne(
            { _id: currentUserData._id },
            {
                $addToSet: {
                    privateChatList: {
                        friendUsername: requestedUser,
                        privateMessageId: privateMessage._id,
                    },
                },
            }
        );

        await User.updateOne(
            { _id: requestedUserData._id },
            {
                $addToSet: {
                    privateChatList: {
                        friendUsername: currentUser,
                        privateMessageId: privateMessage._id,
                    },
                },
            }
        );



        res.status(200).json({ message: "Message request accepted successfully!" });
    } catch (error) {
        console.error("Error accepting message request:", error);
        return res.status(500).json({ message: "Internal server error!" });
    }
};





export const getNotifications = async (req, res) => {
    const { username } = req.params;
    if (!username) {
        return res.status(400).json({ message: "Username not found!" });
    }

    try {
        // Find user and populate messageRequest with only specific fields
        const user = await User.findOne({ userName: username })
            .select("messageRequest")
            .populate({
                path: "messageRequest",
                select: "userName profileImage", // Only selecting needed fields
            });

        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.status(200).json({ notifications: user.messageRequest });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Internal server error!" });
    }
};




export const getConnectedUsers = async (req, res) => {
    const { loggedInUserUsername } = req.params;

    if (!loggedInUserUsername) {
        return res.status(400).json({ message: "Username not provided." });
    }

    try {
        // Fetch the user by username and populate the friendList field
        const user = await User.findOne({ userName: loggedInUserUsername })
            .select("friendList privateChatList") // Only select friendList to reduce data retrieval
            .populate({
                path: "friendList",
                select: "userName profileImage" // Only populate userName and profileImage fields
            });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

       //console.log(user.friendList);
      
        //newly added code: 
        const connectedUsers = user.friendList.map(friend => {
            const privateChat = user.privateChatList.find(
                chat => chat.friendUsername === friend.userName
            );

            return {
                ...friend.toObject(),
                privateMessageId: privateChat ? privateChat.privateMessageId : null,
            };
        });

        //console.log("connected users", connectedUsers);

        // Respond with the populated friendList as connectedUsers
        res.status(200).json({ connectedUsers });
    } catch (error) {
        console.error("Error fetching connected users:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};





export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    // Use a regex for partial, case-insensitive matching
    const users = await User.find({
      userName: { $regex: query, $options: "i" }
    }).select("userName profileImage"); // Only return userName field

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const sendMessage = async (req, res) => {
    const { sender, receiver, content } = req.body;
    
    if (!sender || !receiver || !content) {
        return res.status(400).json({ message: "Sender, receiver, and content are required!" });
    }

    try {
        // Find sender and receiver in the database
        const senderUser = await User.findOne({ userName: sender });
        const receiverUser = await User.findOne({ userName: receiver });

        if (!senderUser || !receiverUser) {
            return res.status(404).json({ message: "Sender or receiver not found!" });
        }

        // Check for an existing PrivateMessage document
        const privateMessage = await PrivateMessage.findOne({
            members: { $all: [senderUser._id, receiverUser._id] },
        });

        if (!privateMessage) {
            return res.status(403).json({ message: "No message thread exists between these users!" });
        }

        const createdAt = new Date().toISOString().split('T')[0];

        // Create a new message
        const newMessage = new Message({
            from: sender,
            to: receiver,
            content,
            isGroupMsg: false, // This is a private message, not a group message
            privateMsgIdentifier: privateMessage._id,
            createdAt
        });

        // Save the message
        await newMessage.save();

        // Add message to the PrivateMessage's message list
        privateMessage.messageList.push(newMessage._id);
        await privateMessage.save();

        res.status(201).json({ message: newMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal server error!" });
    }
};




export const getPreviousMessages = async (req, res) => {
    const { currentUser, chatWithUser } = req.params;

    try {
        // Get user data by username
        const currentUserData = await User.findOne({ userName: currentUser });
        const chatWithUserData = await User.findOne({ userName: chatWithUser });

        if (!currentUserData || !chatWithUserData) {
            return res.status(404).json({ message: "Users not found!" });
        }

        // Find the PrivateMessage document with both users in the members array
        const privateMessage = await PrivateMessage.findOne({
            members: { $all: [currentUserData._id, chatWithUserData._id] },
        }).populate({
            path: "messageList",
            model: "Message",
            select: "from to content createdAt",
            options: { sort: { createdAt: 1 } } // Sort messages by timestamp ascending
        });

        if (!privateMessage) {
            return res.status(404).json({ message: "No previous messages found!" });
        }

        res.status(200).json({ messages: privateMessage.messageList });
    } catch (error) {
        console.error("Error fetching previous messages:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
