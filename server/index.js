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

let users = {};

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

const insertMessage = db.prepare("INSERT INTO messages (sender, text, sent_at) VALUES (?, ?, ?)");

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    const rows = db.prepare("SELECT sender AS username, text, sent_at AS time FROM messages ORDER BY time ASC").all();
    socket.emit("initMessages", rows);

    socket.on("join", () => {
        users[socket.id] = socket.username;
        io.emit("usersUpdate", Object.values(users));

        const systemMsg = {
            username: "systemOnlyUpdates",
            text: `${socket.username} joined the chat`,
            time: Date.now(),
        };
        insertMessage.run(systemMsg.username, systemMsg.text, systemMsg.time);
        io.emit("newMessage", systemMsg);
    });

    socket.on("sendMessage", (msg) => {
        const newMessage = {
            username: socket.username,
            time: Date.now(),
            text: msg.text,
        };
        
        insertMessage.run(newMessage.username, newMessage.text, newMessage.time);
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
            insertMessage.run(systemMsg.username, systemMsg.text, systemMsg.time);
            io.emit("newMessage", systemMsg);
        }
    });
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Token is invalid"));
    };
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        socket.username = decoded.username;
        next();
    } catch (error) {
        return next(new Error("Invalid or expired token"));
    }
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

app.get("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).send("Invalid token");
    }

    try {
        const verify = jwt.verify(token, SECRET_KEY);
        res.json({username: verify.username});
    } catch {
        return res.status(401).send("Verification failed");
    }
});

server.listen(3000, () => {
    console.log("Server running on 3000");
});