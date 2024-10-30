import mongoose from "mongoose";
const publicKeySchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    publicKey: {
        type: String,
        required: true,
    },
});
const Publickey = mongoose.model("Publickey", publicKeySchema);
export default Publickey;
