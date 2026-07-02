import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
},
});

let messages = [];

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);


socket.emit("initMessages", messages);

socket.on("sendMessage", (msg) => {
    const newMessage = {
    ...msg,
    time: Date.now(),
    };

    messages.push(newMessage);

    io.emit("newMessage", newMessage);
});

socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
});
});

server.listen(3000, () => {
    console.log("Server running on 3000");
});