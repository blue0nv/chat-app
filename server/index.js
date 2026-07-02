const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

let messages = [];

app.post("/messages", (req, res) => {
    const { text } = req.body;

    const msg = {
        time: Date.now(),
        username: req.body.username,
        text: req.body.text,
    };

    messages.push(msg);
    res.json(msg);
})

app.get("/messages", (req, res) => {
    res.json(messages);
})