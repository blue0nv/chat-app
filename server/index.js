import express from "express";
import http from "http";
import cors from "cors";
import bcrypt from "bcrypt";
import  Database  from "better-sqlite3";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

const SECRET_KEY = "abcdefghijklmnoqureskfdafdjklsg";


const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const db = new Database("chat.db")

const io = new Server(server, {
cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
},
});

let messages = [];
let users = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);


socket.emit("initMessages", messages);

socket.on("join", (username) => {
    users[socket.id] = username;
    io.emit("usersUpdate", Object.values(users));

    const systemMsg = {
        username: "systemOnlyUpdates",
        text: `${username} joined the chat`,
        time: Date.now(),
    };
    messages.push(systemMsg);
    io.emit("newMessage", systemMsg);
});

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

    const username = users[socket.id];
    delete users[socket.id];
    io.emit("usersUpdate", Object.values(users));

    if (username) {
        const systemMsg = {
        username: "systemOnlyUpdates",
        text: `${username} left the chat`,
        time: Date.now(),
    };
        messages.push(systemMsg);
        io.emit("newMessage", systemMsg);
    }
});
});

app.post("/register", async (req, res) => {
    try {
        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).send('Missing username or password');
        }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insert = db.prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)");
    insert.run(username, hashedPassword, Date.now());

    res.status(201).send("User Successfully created");
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).send("Username already exists");
        }
        res.status(500).send("An error has occured");
    }
})

app.post("/login", async (req, res) => {
    try {
        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).send('Missing username or password');
        }

        const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

        if (!user) {
            return res.status(401).send("Invalid username or password");
        
        }       
        const isMatching = await bcrypt.compare(password, user.password_hash)

        if (!isMatching) {
            return res.status(401).send("Invalid username or password");
        }

        const token = jwt.sign({username: user.username}, SECRET_KEY, {expiresIn: "7d"});
        res.json({token});
    } catch (error) {
        console.log(error); 
        res.status(500).send("An error has occured");
    }
})

server.listen(3000, () => {
    console.log("Server running on 3000");
});

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    sent_at INTEGER NOT NULL
    );
`);