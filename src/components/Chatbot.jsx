import { useEffect, useMemo, useRef, useState } from "react";
import "./chatbot.css";

const knowledgeBase = [
  {
    topic: "identity",
    title: "Who Achintya is",
    keywords: ["name", "who", "about", "intro", "introduction", "achintya", "jaimini"],
    text: "Achintya Jaimini is a Computer Science student at UC Davis who focuses on web development, scalable systems, and practical software infrastructure."
  },
  {
    topic: "education",
    title: "Education",
    keywords: ["education", "college", "university", "school", "study", "degree", "uc davis", "student"],
    text: "He studies Computer Science at UC Davis, combining academic fundamentals with hands-on projects in software, machine learning, and systems."
  },
  {
    topic: "skills",
    title: "Technical skills",
    keywords: ["skill", "tech", "technology", "stack", "language", "programming", "backend", "frontend", "framework"],
    text: "His technical toolkit includes C, C++, Python, Java, JavaScript, React, Flask, Django, Assembly, Linux/Unix, Docker, Git, shell scripting, TensorFlow, and NumPy."
  },
  {
    topic: "projects",
    title: "Projects",
    keywords: ["project", "built", "portfolio", "github", "voice", "assistant", "login", "davis friends", "eeg", "glare", "flare"],
    text: "Featured projects include a Python voice-enabled assistant, a Flask login portal, Davis Friends for iOS, an image flare/glare removal project, and Neurotech EEG analysis with TensorFlow."
  },
  {
    topic: "experience",
    title: "Experience",
    keywords: ["experience", "work", "job", "role", "intern", "director", "resident", "leadership", "seo"],
    text: "His experience includes Infrastructure Director for Swift Coding Club at UC Davis, front-end web work for Seguros Medical Products and Home Details Services, Resident Assistant at UC Davis, AISC Beginners Sprint, and Neurotech @ Davis."
  },
  {
    topic: "book",
    title: "Book",
    keywords: ["book", "author", "master", "stroke", "published", "writing", "recovery", "hemiparesis"],
    text: "Achintya authored Master The Stroke, a personal account of recovery from a brain stroke and hemiparesis that highlights persistence and resilience."
  },
  {
    topic: "interests",
    title: "Interests",
    keywords: ["hobby", "interest", "rubik", "exercise", "teach", "travel", "fun"],
    text: "Outside the core CS work, he enjoys solving Rubik's Cubes, exercising, teaching mathematics, and exploring new places and ideas."
  },
  {
    topic: "contact",
    title: "Contact",
    keywords: ["contact", "linkedin", "connect", "reach", "profile"],
    text: "The best visible contact path on the site is Achintya's LinkedIn profile, linked from the hero section."
  }
];

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "can", "do", "for", "from", "he",
  "his", "how", "i", "in", "is", "it", "me", "of", "on", "or", "tell", "that",
  "the", "this", "to", "was", "what", "with", "you", "your"
]);

const sentenceOpeners = [
  "Absolutely.",
  "Here's the short version.",
  "Good question.",
  "A strong angle is this:"
];

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

function scoreEntry(entry, tokens, rawQuestion) {
  const searchableText = `${entry.title} ${entry.text} ${entry.keywords.join(" ")}`.toLowerCase();
  const keywordScore = entry.keywords.reduce((score, keyword) => {
    return rawQuestion.includes(keyword) ? score + 4 : score;
  }, 0);
  const tokenScore = tokens.reduce((score, token) => {
    return searchableText.includes(token) ? score + 1 : score;
  }, 0);

  return keywordScore + tokenScore;
}

function inferIntent(question) {
  if (/\b(compare|best|strongest|highlight|impressive)\b/i.test(question)) return "recommend";
  if (/\b(list|all|everything|summarize|overview)\b/i.test(question)) return "summary";
  if (/\b(why|how|explain)\b/i.test(question)) return "explain";
  return "answer";
}

function buildResponse(question, history) {
  const rawQuestion = question.toLowerCase();
  const tokens = tokenize(question);
  const intent = inferIntent(question);
  const ranked = knowledgeBase
    .map((entry) => ({ ...entry, score: scoreEntry(entry, tokens, rawQuestion) }))
    .sort((a, b) => b.score - a.score);
  const matches = ranked.filter((entry) => entry.score > 0).slice(0, intent === "summary" ? 4 : 2);

  if (/\b(hi|hello|hey)\b/i.test(question)) {
    return {
      text: "Hi, I'm Achintya's portfolio assistant. Ask me about his projects, skills, experience, book, interests, or background.",
      topic: "identity"
    };
  }

  if (!matches.length) {
    const lastBotTopic = [...history].reverse().find((message) => message.topic)?.topic;
    const followUp = knowledgeBase.find((entry) => entry.topic === lastBotTopic);

    if (followUp && tokens.length < 4) {
      return {
        text: `${followUp.text} You can also ask me to connect that to his projects, skills, or experience.`,
        topic: followUp.topic
      };
    }

    return {
      text: "I can answer best when the question is about Achintya's skills, projects, experience, education, book, or interests. Try asking, \"What projects has he built?\" or \"What is his strongest technical stack?\"",
      topic: "identity"
    };
  }

  if (intent === "recommend") {
    const project = knowledgeBase.find((entry) => entry.topic === "projects");
    const skills = knowledgeBase.find((entry) => entry.topic === "skills");
    return {
      text: `The strongest portfolio signal is the mix of practical software and leadership. ${project.text} ${skills.text}`,
      topic: "projects"
    };
  }

  const opener = sentenceOpeners[(question.length + matches.length) % sentenceOpeners.length];
  const answer = matches.map((entry) => entry.text).join(" ");

  if (intent === "explain") {
    return {
      text: `${opener} ${answer} That combination shows both technical range and a bias toward building things people can actually use.`,
      topic: matches[0].topic
    };
  }

  if (intent === "summary") {
    return {
      text: `${opener} ${answer}`,
      topic: matches[0].topic
    };
  }

  return {
    text: `${opener} ${answer}`,
    topic: matches[0].topic
  };
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi, ask me anything about Achintya.",
      topic: "identity"
    }
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef(null);

  const suggestions = useMemo(() => [
    "What projects has he built?",
    "Summarize his skills",
    "What is his experience?"
  ], []);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, thinking, open]);

  const sendMessage = (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || thinking) return;

    const userMsg = { from: "user", text };
    setMessages((currentMessages) => [...currentMessages, userMsg]);
    setInput("");
    setThinking(true);

    window.setTimeout(() => {
      const response = buildResponse(text, messages);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          from: "bot",
          text: response.text,
          topic: response.topic
        }
      ]);
      setThinking(false);
    }, 420);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      <button
        className="chat-button"
        onClick={() => setOpen(!open)}
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "x" : <span>&#128172;</span>}
      </button>

      {open && (
        <section className="chat-window" aria-label="Portfolio chatbot">
          <div className="chat-header">
            <div>
              <strong>Ask About Achintya</strong>
            </div>
          </div>

          <div className="chat-body" ref={bodyRef}>
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`msg ${message.from}`}>
                {message.text}
              </div>
            ))}
            {thinking && (
              <div className="msg bot thinking">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>

          <div className="chat-suggestions" aria-label="Suggested questions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} onClick={() => sendMessage(suggestion)} type="button">
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about projects, skills, experience..."
              aria-label="Message"
            />
            <button type="submit" disabled={thinking}>
              Send
            </button>
          </form>
        </section>
      )}
    </>
  );
}
