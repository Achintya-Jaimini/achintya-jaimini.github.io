import { useState } from "react";
import "./chatbot.css";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Ask me anything about Achintya 👋" }
  ]);
  const [input, setInput] = useState("");

  const getReply = (msg) => {
  const q = msg.toLowerCase();

  if (q.includes("name")) {
    return "It is my pleasure to introduce Achintya Jaimini, a passionate Computer Science student at UC Davis whose journey is defined by curiosity, resilience, and a commitment to lifelong learning.";
  }

  if (q.includes("skill")) {
    return "Achintya's technical repertoire is a rich tapestry woven from C, C++, Python, Java, React, Flask, Django, Assembly, and numerous other technologies cultivated through dedication and exploration.";
  }

  if (q.includes("project")) {
    return "Among the many endeavors that have captured Achintya's imagination are a voice-enabled assistant, a secure login portal, EEG data analysis initiatives, and the Davis Friends application, each reflecting a desire to create meaningful and impactful solutions.";
  }

  if (q.includes("experience")) {
    return "His professional journey has been marked by leadership, service, and innovation, including roles as Infrastructure Director, Front-End Developer, and Resident Assistant, where he has consistently sought to empower those around him.";
  }

  if (q.includes("book")) {
    return "Achintya is the author of 'Master The Stroke,' a deeply personal narrative chronicling perseverance, determination, and the remarkable ability of the human spirit to overcome adversity.";
  }

  if (
    q.includes("education") ||
    q.includes("college") ||
    q.includes("university") ||
    q.includes("study")
  ) {
    return "Achintya currently pursues a degree in Computer Science at UC Davis, where rigorous academic study and hands-on experience come together to shape the foundation of his future aspirations.";
  }

  if (q.includes("hobby") || q.includes("interest")) {
    return "Beyond academics and technology, Achintya enjoys solving Rubik's Cubes, playing chess, exercising, teaching mathematics, and embracing opportunities to explore new places and ideas.";
  }

  return "I would be delighted to share more about Achintya's education, technical expertise, projects, leadership experiences, hobbies, or literary accomplishments. Simply ask, and I shall gladly illuminate another chapter of his story.";
};

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    const botMsg = { from: "bot", text: getReply(input) };

    setMessages([...messages, userMsg, botMsg]);
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <div className="chat-button" onClick={() => setOpen(!open)}>
        💬
      </div>

      {/* Chat Window */}
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            Ask About Me
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}