import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import { setupSocket } from "./socket.js";
// import { createAdapter } from "@socket.io/redis-streams-adapter";
// import redis from "./config/redis.config.js";
//import { instrument } from "@socket.io/admin-ui";
dotenv.config();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
    //   adapter: createAdapter(redis),
});
// instrument(io, {
//   auth: false,
//   mode: "development",
// });
setupSocket(io);
export { io };
connectDB()
    .then(() => {
    server.listen(process.env.PORT || 7000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
})
    .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});
