import { useState } from "react";

export default function Chatbot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const askAI = async () => {
    const response = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
      }),
    });

    const data = await response.json();
    setAnswer(data.answer);
  };

  return (
    <div className="chatbot">
      <h3>Ask About Achintya</h3>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask me anything..."
      />

      <button onClick={askAI}>Ask</button>

      {answer && (
        <div className="answer">
          {answer}
        </div>
      )}
    </div>
  );
}