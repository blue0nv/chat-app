import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import "./App.css";

function App() {
  useEffect(() => {
    fetch("http://localhost:3000/")
      .then((res) => res.text())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
  }, []);

    const [messages, setMessages] = useState([]);
    useEffect(() => {
      fetch("http://localhost:3000/messages")
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
      })
    }, [])
  
    const [text, setText] = useState("");
    const sendMessage = () => {
      if (!text.trim()) return;

      fetch("http://localhost:3000/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          text}),
      })
      .then((res) => res.json())
      .then((newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        setText("");
      });
    };

    const messageBoxRef = useRef(null)
    useEffect(() => {
      if (messageBoxRef.current) {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
      }
    }, [messages])

    const [username, setUsername] = useState("");
    const [usernameInput, setUsernameInput] = useState("");

    if (!username) {
    return (
      <div>
        <h2>Join Chat</h2>
        <input
          type="text"
          placeholder="Username"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}/>
        <button onClick={() => setUsername(usernameInput)}>Join</button>
      </div>
  );
}

  return (
    <div className="container">

      <div className="chatWindow">

      <div className="header">
      <h1>Chat App</h1>
      <h5>Logged in as: <strong>{username}</strong></h5>
      </div>

      <div className="messageBox" ref={messageBoxRef}>
      {messages.map((msg) => (
  <div
    key={msg.time}
    className={`messageRow ${
        msg.username === username ? "own" : "other"
      }`}
    >
      <div className="messageBubble">

        <div className="messageHeader">
          <strong>{msg.username}</strong>
          <span className="time">
            {new Date(msg.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="messageText">
          {msg.text}
        </div>

      </div>
    </div>
))}
      </div>

      <div className="inputRow">
      <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Type a message..."
      onKeyDown={ (e) => {
        if (e.key === "Enter") {
          sendMessage();
      }}
    }/>

    <button onClick={sendMessage}>Send</button> 
        </div>
      </div>
    </div>
  );
}

export default App;