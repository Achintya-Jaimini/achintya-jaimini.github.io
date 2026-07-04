import React, { useEffect, useRef, useState } from 'react';
import { 
  Terminal, Cpu, Globe, Server, Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import './App.css';
import Chatbot from "./components/Chatbot";

const initialContactForm = {
  name: '',
  email: '',
  message: ''
};
const renderContactEndpoint = 'https://achintya-portfolio.onrender.com/api/contact';
const contactEndpoint =
  process.env.REACT_APP_CONTACT_ENDPOINT ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
    ? renderContactEndpoint
    : '/api/contact');
const melodyPattern = [
  329.63, 392, 493.88, 587.33,
  493.88, 392, 440, 523.25
];

function startAmbientMusic(audioStateRef) {
  if (audioStateRef.current) {
    audioStateRef.current.context.resume().catch(() => {});
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(0.045, context.currentTime);
  masterGain.connect(context.destination);

  const delay = context.createDelay();
  const delayGain = context.createGain();
  delay.delayTime.setValueAtTime(0.18, context.currentTime);
  delayGain.gain.setValueAtTime(0.18, context.currentTime);
  delay.connect(delayGain);
  delayGain.connect(masterGain);

  let noteIndex = 0;
  const playNote = () => {
    const now = context.currentTime;
    const frequency = melodyPattern[noteIndex % melodyPattern.length];
    const oscillator = context.createOscillator();
    const voiceGain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.006, now + 0.16);
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(0.28, now + 0.015);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    oscillator.connect(voiceGain);
    voiceGain.connect(masterGain);
    voiceGain.connect(delay);
    oscillator.start(now);
    oscillator.stop(now + 0.34);
    noteIndex += 1;
  };

  playNote();
  const intervalId = window.setInterval(playNote, 360);

  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  lfo.frequency.setValueAtTime(0.16, context.currentTime);
  lfoGain.gain.setValueAtTime(0.006, context.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);
  lfo.start();

  audioStateRef.current = {
    context,
    stop: () => {
      window.clearInterval(intervalId);
      lfo.stop();
      context.close();
    }
  };

  context.resume().catch(() => {});
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

const App = () => {
  const [contactForm, setContactForm] = useState(initialContactForm);
  const [contactStatus, setContactStatus] = useState('');
  const [contactFormStartedAt, setContactFormStartedAt] = useState(() => Date.now());
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const audioStateRef = useRef(null);
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  useEffect(() => {
    const beginMusic = () => startAmbientMusic(audioStateRef);

    beginMusic();

    const interactionEvents = ['click', 'keydown', 'touchstart', 'scroll'];
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, beginMusic, { once: true, passive: true });
    });

    return () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, beginMusic);
      });
      audioStateRef.current?.stop();
      audioStateRef.current = null;
    };
  }, []);

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const message = formData.get('message')?.toString().trim();
    const website = formData.get('website')?.toString() || '';
    const formStartedAt = formData.get('formStartedAt')?.toString() || '';

    if (!name || !email || !message) {
      setContactStatus('Please complete every field before sending.');
      return;
    }

    if (website || Date.now() - Number(formStartedAt) < 1200) {
      setContactStatus('Thanks. Your message has been received.');
      setContactForm(initialContactForm);
      setContactFormStartedAt(Date.now());
      return;
    }

    setIsContactSubmitting(true);
    setContactStatus('');

    try {
      const response = await fetch(contactEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          subject: 'Portfolio contact',
          message,
          website,
          formStartedAt
        })
      });
      const responseText = await response.text();
      const result = parseJson(responseText);

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Contact API returned ${response.status}. ${
              responseText ? responseText.slice(0, 160) : 'No response body was returned.'
            }`
        );
      }

      setContactStatus('Thanks. Your message has been received.');
      setContactForm(initialContactForm);
      setContactFormStartedAt(Date.now());
    } catch (error) {
      console.error('Contact form error:', error);
      setContactStatus(error?.message || 'Sorry, your message could not be sent. Please try again.');
    } finally {
      setIsContactSubmitting(false);
    }
  };

  return (
    <div className="portfolio">
      {/* NAVIGATION */}
      <nav className="navbar">
        <div className="nav-logo">AJ</div>
        <div className="nav-links">
          <a href="#skills">Skills</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero">
        <motion.div {...fadeIn}>
          <h1>I'm Achintya Jaimini</h1>
          
          <span className="badge">Computer Science @ UC Davis</span>
          <br></br>
          <br></br>
          <p className="hero-bio">
            Specializing in web development and scalable systems. 
            Passionate about building efficient and reliable software infrastructure.
          </p>
          <div className="social-links">
            <br></br>
            <a href="https://www.linkedin.com/in/achintya-jaimini/" target="_blank" rel="noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0077B5">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg></a>
          </div>
        </motion.div>
      </header>

      {/* AUTHORSHIP HIGHLIGHT */}<a href="https://www.amazon.com/Master-Stroke-Persistence-Achintya-Jaimini-ebook/dp/B0CLNHST5S"><center>
      <section className="highlight-container">
        <motion.div className="book-card" {...fadeIn}>
          <div className="book-content">
            <h3>Published Author: "Master The Stroke"</h3>
            <p>
              Detailed my personal recovery from a brain stroke and hemiparesis. 
              This journey of resilience defines my strengths in overcoming challenges.
            </p>
          </div>
        </motion.div>
      </section>
      </center></a>

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
            <p>Docker, Git, Shell Scripting</p>
          </div>
          <div className="skill-card">
            <Globe className="skill-icon" />
            <h4>Web Development</h4>
            <p>JavaScript, Debugging, Optimization</p>
          </div>
          <div className="skill-card">
            <Cpu className="skill-icon" />
            <h4>Frameworks</h4>
            <p>TensorFlow, NumPy, React.js, Flask, Django</p>
          </div>
        </div>
      </section>

      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      {/* EXPERIENCE SECTION */}
      <section id="experience" className="section-padding bg-dark">
        <h2 className="section-title">Experience</h2>
        <a href="https://www.linkedin.com/in/achintya-jaimini/details/experience/" target="_blank" rel="noreferrer">
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-date">2025 - 2026</div>
            <div className="timeline-content">
              <h4>Infrastructure Director</h4>
              <h5>Swift Coding Club @ UC Davis</h5>
              <p>Leading development and upkeep of the club's website and app.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2025 - 2026</div>
            <div className="timeline-content">
              <h4>Web Developer Intern</h4>
              <h5>Seguros Medical Products, Sacremento, CA; Home Details Services LLC, Lincoln, CA</h5>
              <p>supporting web development, gaining experience in remote web design and Search Engine Optimization</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2024 - 2026</div>
            <div className="timeline-content">
              <h4>Resident Assistant</h4>
              <h5>UC Davis</h5>
              <p>Managing conflict resolution between residents and hosting events for residents in the community.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2024 - 2024</div>
            <div className="timeline-content">
              <h4>AISC - Beginners Sprint</h4>
              <h5>UC Davis</h5>
              <p>Mutually developed Python program to remove flare and glare effects from images.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2023 - 2024</div>
            <div className="timeline-content">
              <h4>Neurotech @ Davis</h4>
              <h5>UC Davis</h5>
              <p>Collaborated on a machine learning project analyzing EEG data using Python.</p>
            </div>
          </div>
        </div></a>
      </section> 

      {/* PROJECTS SECTION */}
      <section id="projects" className="section-padding">
        <h2 className="section-title">Featured Projects</h2>
        <div className="projects-container">
          <a href='https://github.com/Achintya-Jaimini/Team-Nexus/blob/main/Intelli.py' target="_blank" rel="noreferrer">
            <div className="project-glass-card">
              <h4>Voice-Enabled Assistant</h4>
              <p>Python-based system using SpeechRecognition and pyttsx3 for edge-case voice handling.</p>
              <div className="tags"><span>Python</span><span>Speech Recognition</span></div>
            </div>
          </a>
          <a href='https://github.com/Achintya-Jaimini/loginportal' target="_blank" rel="noreferrer">
            <div className="project-glass-card">
              <h4>Login Portal</h4>
              <p>Built a Flask-based authentication system with input validation and session handling,</p>
              <div className="tags"><span>Python</span><span>Flask</span></div>
            </div>
          </a>
          <a href='https://github.com/Swift-Coding-Club-UCD/DavisFriends' target="_blank" rel="noreferrer">
            <div className="project-glass-card">
              <h4>Davis Friends</h4>
              <p>developed an app to unify all the events happening in the
recovery challenges and procedure of
city of Davis</p>
              <div className="tags"><span>Swift</span><span>iOS</span></div>
            </div>
          </a>
          <a href='https://drive.google.com/file/d/18MqbvxZs5-pGypKySO-Ymr11zAMAm3zn/view?usp=sharing' target="_blank" rel="noreferrer">
            <div className="project-glass-card">
              <h4>Flare/Glare Removal</h4>
              <p>Developed a Python program to remove flare and glare effects from images.</p>
              <div className="tags"><span>Python</span><span>Image Processing</span></div>
            </div>
          </a>
          <a href='https://drive.google.com/file/d/1gJ1dHswbzEsnNjHOQ_Aq0BoaRaH7xK0e/view?usp=sharing' target="_blank" rel="noreferrer">
            <div className="project-glass-card">
              <h4>Neurotech EEG Analysis</h4>
              <p>Collaborated on ML models using TensorFlow to study consumer behavior via EEG data.</p>
              <div className="tags"><span>Python</span><span>TensorFlow</span></div>
            </div>
          </a>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="section-padding contact-section">
        <motion.div className="contact-shell" {...fadeIn}>
          <div className="contact-copy">
            <h2 className="section-title">Contact</h2>
            <p>
              Have a project, opportunity, or question? Send a note and I will follow up.
            </p>
          </div>

          <form className="contact-form" onSubmit={handleContactSubmit}>
            <label>
              <span>Name</span>
              <input
                name="name"
                type="text"
                value={contactForm.name}
                onChange={handleContactChange}
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={contactForm.email}
                onChange={handleContactChange}
                required
              />
            </label>

            <label className="message-field">
              <span>Message</span>
              <textarea
                name="message"
                value={contactForm.message}
                onChange={handleContactChange}
                rows="5"
                required
              />
            </label>
            <input type="text" name="website" tabIndex="-1" autoComplete="off" hidden />
            <input type="hidden" name="formStartedAt" value={contactFormStartedAt} readOnly />

            {contactStatus && <p className="contact-status">{contactStatus}</p>}

            <div className="contact-actions">
              <button className="contact-submit" type="submit" disabled={isContactSubmitting}>
                <Send />
                {isContactSubmitting ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </form>
        </motion.div>
      </section>

      <Chatbot />

      <footer className="footer">
        <p>© 2026 Achintya Jaimini</p>
      </footer>
    </div>
  );
};

export default App;
