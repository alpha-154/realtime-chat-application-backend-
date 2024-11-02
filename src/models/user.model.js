import mongoose, { Schema } from "mongoose";
// Define the user schema
const userSchema = new Schema({
    publicKey: {
        type: String,
        required: true,
        unique: true,
    },
    privateKey: {
        type: String,
        required: true,
        unique: true,
    },
    userName: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profileImage: {
        type: String, 
        default: "",
      },
    groupList: [
        {
            type: Schema.Types.ObjectId,
            ref: "Group", // Reference to Group documents
        },
    ],
    privateChatList: [
        {
            friendUsername: {
                type: String,
            },
            privateMessageId: {
                type: Schema.Types.ObjectId,
                ref: "PrivateMessage",
            },
        },
    ],
    friendList: [
        {
            type: Schema.Types.ObjectId,
            ref: "User", // Reference to User documents
        },
    ],
    messageRequest: [
        {
            type: Schema.Types.ObjectId,
            ref: "User", // Reference to User documents
        },
    ],
    createdAt: {
        type: String,
    },
}, { timestamps: true });
// Define and export the model with the IUser interface
const User = mongoose.model("User", userSchema);
export default User;
