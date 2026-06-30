import React from "react";
import { Children } from "react";
import { useState } from "react";
import { useEffect } from "react";

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
      if (!text.trim) return;

      fetch("http://localhost:3000/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({text}),
      })
      .then((res) => res.json())
      .then((newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        setText("");
      });
    };

  return (
    <div>
      <h1>Chat App</h1>
      {messages.map((data) => <p key={data.id}>{data.text} </p>)}

      <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Type a message..."
      onKeyDown={ (e) => {
        if (e.key === "Enter") {
          sendMessage();
      }}
    }
    />

    <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;