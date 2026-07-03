import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:3000")

function App() {

  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/")
      .then((res) => res.text())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
  }, []);

    const [messages, setMessages] = useState([]);
    useEffect(() => {
      socket.on("initMessages", (msgs) => {
      setMessages(msgs);
  });

  socket.on("newMessage", (msg) => {
    setMessages((prev) => [...prev, msg]);
  });

  return () => {
    socket.off("initMessages");
    socket.off("newMessage");
  };
}, []);
  
    const [text, setText] = useState("");
    const sendMessage = () => {
      if (!text.trim()) return;

    socket.emit("sendMessage", {
      username,
      text,
    });

    setText("");
};

    const [users, setUsers] = useState([]);
    useEffect(() => {
      if (username) {
        socket.emit(("join"), username)
      }
    }, [username])

    useEffect(() => {
  socket.on("usersUpdate", (list) => {
    setUsers(list);
  });

  return () => {
    socket.off("usersUpdate");
  };
}, []);

    const messageBoxRef = useRef(null)
    useEffect(() => {
      if (messageBoxRef.current) {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
      }
    }, [messages])

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

    <div className="usersPanel">
    <h3>Online</h3>

    {users.map((user, i) => (
      <div key={i} className="userItem">
        {user}
      </div>
    ))}
  </div>

      <div className="chatWindow">

      <div className="header">
      <h1>Chat App</h1>
      <h5>Logged in as: <strong>{username}</strong></h5>
      </div>

      <div className="messageBox" ref={messageBoxRef}>
      {messages.map((msg) =>
    msg.username === "systemOnlyUpdates" ? (
    <div key={msg.time} className="systemMessage">
      {msg.text}
    </div>
  ) : (
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
        <div className="messageText">{msg.text}</div>
      </div>
    </div>
  )
)}
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