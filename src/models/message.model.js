import mongoose, { Schema } from "mongoose";
// Define the user schema
const messageSchema = new Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    isGroupMsg: {
        type: Boolean,
        required: true,
    },
    groupMsgIdentifier: {
        type: Schema.Types.ObjectId,
        ref: "Group", // Reference to Group documents
    },
    privateMsgIdentifier: {
        type: Schema.Types.ObjectId,
        ref: "PrivateMessage", // Reference to PrivateMessage documents
    },
    createdAt: {
        type: String,
    },
}, { timestamps: true });
// Define and export the model with the IUser interface
const Message = mongoose.model("Message", messageSchema);
export default Message;
