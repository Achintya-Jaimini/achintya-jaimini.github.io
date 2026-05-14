import React from 'react';
import { 
  Mail, Terminal, Book, Code, 
  ExternalLink, Cpu, Globe, Server, Award 
} from 'lucide-react';
import { motion } from 'framer-motion';
import './App.css';

const App = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="portfolio">
      {/* NAVIGATION */}
      <nav className="navbar">
        <div className="nav-logo">AJ</div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#experience">Experience</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero">
        <motion.div {...fadeIn}>
          <span className="badge">CS @ UC Davis</span>
          <h1>Achintya Jaimini</h1>
          <p className="subtitle">Infrastructure Director & Software Engineer</p>
          <p className="hero-bio">
            Specializing in backend development, scalable systems, and CI/CD workflows. 
            Passionate about building reliable software infrastructure.
          </p>
          <div className="social-links">
            <a href="mailto:achintyajaimini@gmail.com"><Mail size={20} /></a>
            {/* <a href="https://linkedin.com" target="_blank" rel="noreferrer"><Linkedin size={20} /></a>
            <a href="https://github.com" target="_blank" rel="noreferrer"><Github size={20} /></a> */}
          </div>
        </motion.div>
      </header>

      {/* AUTHORSHIP HIGHLIGHT */}
      <section className="highlight-container">
        <motion.div className="book-card" {...fadeIn}>
          <div className="book-icon-wrapper">
            <Book className="icon-gold" size={32} />
          </div>
          <div className="book-content">
            <h3>Published Author: "Master The Stroke"</h3>
            <p>
              Detailed my personal recovery from a brain stroke and hemiparesis. 
              This journey of resilience defines my approach to complex problem-solving in engineering.
            </p>
          </div>
        </motion.div>
      </section>

      {/* SKILLS SECTION */}
      <section id="skills" className="section-padding">
        <h2 className="section-title">Technical Arsenal</h2>
        <div className="skills-grid">
          <div className="skill-card">
            <Terminal className="skill-icon" />
            <h4>Backend & Systems</h4>
            <p>C/C++, Python, Java, Assembly, Linux/Unix</p>
          </div>
          <div className="skill-card">
            <Server className="skill-icon" />
            <h4>Infrastructure</h4>
            <p>Docker, CI/CD Pipelines (Drone CI), Git, Shell Scripting</p>
          </div>
          <div className="skill-card">
            <Globe className="skill-icon" />
            <h4>Web Development</h4>
            <p>React.js, Flask, Django, JavaScript, HTML/CSS</p>
          </div>
          <div className="skill-card">
            <Cpu className="skill-icon" />
            <h4>AI & Math</h4>
            <p>TensorFlow, NumPy, Discrete Math, Linear Algebra</p>
          </div>
        </div>
      </section>

      {/* EXPERIENCE SECTION */}
      <section id="experience" className="section-padding bg-dark">
        <h2 className="section-title">Experience</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-date">2025 - Present</div>
            <div className="timeline-content">
              <h4>Infrastructure Director</h4>
              <h5>Swift Coding Club</h5>
              <p>Leading development and upkeep of the club's website and app. Unifying Davis events through scalable infrastructure.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2024 - 2026</div>
            <div className="timeline-content">
              <h4>Resident Assistant</h4>
              <h5>UC Davis</h5>
              <p>Managing conflict resolution and coordinating solutions for diverse stakeholders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS SECTION */}
      <section id="projects" className="section-padding">
        <h2 className="section-title">Featured Projects</h2>
        <div className="projects-container">
          <div className="project-glass-card">
            <h4>CI/CD Debugging & QA Validation</h4>
            <p>Root-cause analysis in Docker environments using logs and environment variable tracing.</p>
            <div className="tags"><span>Docker</span><span>Drone CI</span><span>QA</span></div>
          </div>
          <div className="project-glass-card">
            <h4>Voice-Enabled Assistant</h4>
            <p>Python-based system using SpeechRecognition and pyttsx3 for edge-case voice handling.</p>
            <div className="tags"><span>Python</span><span>AI</span><span>Automation</span></div>
          </div>
          <div className="project-glass-card">
            <h4>Neurotech EEG Analysis</h4>
            <p>Collaborated on ML models using TensorFlow to study consumer behavior via EEG data.</p>
            <div className="tags"><span>TensorFlow</span><span>Neuroscience</span></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 Achintya Jaimini | San Ramon, CA | UC Davis</p>
      </footer>
    </div>
  );
};

export default App;