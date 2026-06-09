import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const ABOUT_ME = `
Achintya Jaimini is a Computer Science student at UC Davis.

Skills:
C, C++, Python, Java, React, Flask, Django, Assembly.

Experience:
- Infrastructure Director, Swift Coding Club
- Front End Developer
- Resident Assistant
- Neurotech @ Davis

Projects:
- Voice Enabled Assistant
- Login Portal
- Davis Friends
- EEG Analysis

Book:
Master The Stroke

Only answer questions about Achintya.
`;

app.post("/chat", async (req, res) => {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: `${ABOUT_ME}

Question: ${req.body.question}

Answer:`,
        stream: false
      })
    });

    const data = await response.json();

    res.json({
      answer: data.response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      answer: "Error connecting to model."
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});