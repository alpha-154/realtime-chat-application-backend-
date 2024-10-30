export function setupSocket(io) {
    io.use((socket, next) => {
        const room = socket.handshake.auth.room || socket.handshake.headers.room;
        if (!room) {
            return next(new Error("Invalid room"));
        }
        socket.room = room;
        next();
    });
    io.on("connection", (socket) => {
        // join room
        socket.join(socket.room);
        console.log("a user connected", socket.id);
        socket.on("message", async (data) => {
            console.log("server side message data is", data);
            //socket.broadcast.emit("message", data);
            // await prisma.chats.create({
            //     data: data
            // })
            socket.to(socket.room).emit("message", data);
        });
        socket.on("disconnect", () => {
            console.log(" a user disconnected", socket.id);
        });
    });
}
