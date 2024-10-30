import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// * Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Specify the frontend origin
    credentials: true, // Allow credentials (cookies, authorization headers)
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

//routes import
import userRouter from "./routes/user.routes.js";
import groupRouter from "./routes/group.routes.js";

//routes configuration
app.use("/api/user", userRouter);
app.use("/api/group", groupRouter);

export default app;
