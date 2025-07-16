import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/ChatPage.css";

export default function ChatPage({ rideId }) {
  const { activeAccount } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mock: Load chat messages for the ride (replace with your API call)
  useEffect(() => {
    // TODO: Fetch messages from backend by rideId
    // Example static initial messages:
    setMessages([
      { id: 1, user: "John", text: "Hello, are you nearby?", isMe: false },
      { id: 2, user: activeAccount?.name, text: "Yes, I'll be there soon!", isMe: true },
    ]);
  }, [rideId, activeAccount]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Mock new message (replace with API call to save)
    const newMessage = {
      id: Date.now(),
      user: activeAccount?.name,
      text: inputText,
      isMe: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCallClick = () => {
    alert("Call feature is coming soon! Integrate with WebRTC or a calling API.");
  };

  const handleVideoCallClick = () => {
    alert("Video call feature is coming soon! Integrate with WebRTC or a video call API.");
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h2>Ride Chat</h2>
        <div className="call-buttons">
          <button onClick={handleCallClick} aria-label="Start Voice Call" title="Voice Call">
            📞
          </button>
          <button onClick={handleVideoCallClick} aria-label="Start Video Call" title="Video Call">
            🎥
          </button>
        </div>
      </header>

      <main className="chat-messages" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.isMe ? "chat-message-me" : "chat-message-other"}`}
          >
            {!msg.isMe && <div className="chat-user">{msg.user}</div>}
            <div className="chat-text">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-input-area">
        <textarea
          aria-label="Type your message"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          rows={2}
        />
        <button onClick={handleSendMessage} aria-label="Send Message" disabled={!inputText.trim()}>
          ➤
        </button>
      </footer>
    </div>
  );
}
