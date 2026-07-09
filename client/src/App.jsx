import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

function App() {

  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io("http://localhost:3000", {
      auth: {token},
    });

    socketRef.current.on("initMessages", (msgs) => {
      setMessages(msgs);
    });

    socketRef.current.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("usersUpdate", (list) => {
      setUsers(list);
    });

    socketRef.current.emit("join");

  }, [token]);

  useEffect(() => {
    const checkToken = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://localhost:3000/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        if (!res.ok) {
            localStorage.removeItem("token");
            return;
        }

        const data = await res.json(); 
        setToken(token);
        setUsername(data.username);
    };

    checkToken();
}, []);

  useEffect(() => {
    fetch("http://localhost:3000/")
      .then((res) => res.text())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
  }, []);

  const handleLogin = async () => {
    const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      setAuthError(errorText);
      return;
    }

    setAuthError("");
    const data = await res.json();
    setToken(data.token);
    localStorage.setItem("token", data.token)
    setUsername(usernameInput);
};

  const handleReg = async () => {
    const res = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify( { username: usernameInput, password: passwordInput }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      setAuthError(errorText);
      return;
    }

    setAuthError("");
    await handleLogin()
  };
  
  const sendMessage = () => {
    if (!text.trim()) return;

    socketRef.current.emit("sendMessage", { text });
    setText("");
};

  const messageBoxRef = useRef(null)
    useEffect(() => {
      if (messageBoxRef.current) {
        messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
      }
    }, [messages])

  if (!username) {
    return (
        <div className="authContainer">
            <div className="authCard">
                <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
                <p className="authSubtitle">
                    {isRegistering ? "Join the conversation" : "Sign in to continue chatting"}
                </p>

                {authError && <p className="authError">{authError}</p>}

                <input
                    type="text"
                    placeholder="Username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                />

                <button onClick={isRegistering ? handleReg : handleLogin}>
                    {isRegistering ? "Register" : "Login"}
                </button>

                <p className="authToggle">
                    {isRegistering ? "Already have an account? " : "Don't have an account? "}
                    <span onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }}>
                      {isRegistering ? "Login" : "Register"} </span>
                </p>
            </div>
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