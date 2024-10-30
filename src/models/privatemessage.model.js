import mongoose, { Schema } from "mongoose";
const privateMessageSchema = new mongoose.Schema({
    members: [
        {
            type: String,
            required: true,
        },
    ],
    messageList: [
        {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const PrivateMessage = mongoose.model("PrivateMessage", privateMessageSchema);
export default PrivateMessage;
