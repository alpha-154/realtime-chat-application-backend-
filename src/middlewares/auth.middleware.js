import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
const authoriseUser = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        // console.log(token);
        if (!token) {
            res.status(400).json({ message: "Token is missing!" });
            return;
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -privateKey");
        if (!user) {
            res.status(400).json({ message: "Invalid access token" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error!" });
    }
};
export default authoriseUser;
