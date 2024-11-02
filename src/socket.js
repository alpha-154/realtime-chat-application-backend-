export function setupSocket(io) {
    console.log("setup socket function called")
    io.use((socket, next) => {
        const room = socket.handshake.auth.room || socket.handshake.headers.room;
        if (!room) {
            return next(new Error("Invalid room"));
        }
        console.log("roomID", room);
        socket.room = room;
        next();
    });
    io.on("connection", (socket) => {
        // join room
        socket.join(socket.room);
        console.log(`User ${socket.id} joined room ${socket.room}`);
        socket.on("message",  (data) => {
            console.log("server side message data is", data);
          
           
           socket.to(socket.room).emit("message", data);
           console.log(`Broadcasting message to room: ${socket.room}`);
            //socket.broadcast.emit("message", data);
        });
        socket.on("disconnect", () => {
            console.log(" a user disconnected", socket.id);
        });
    });
}
