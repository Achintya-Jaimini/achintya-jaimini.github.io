import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { 
  Terminal, Cpu, Globe, Server, RotateCcw, Swords, Bot, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import './App.css';
import Chatbot from "./components/Chatbot";

const pieceGlyphs = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚'
};

const pieceValues = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

const pieceSquareTables = {
  p: [
     0,   0,   0,   0,   0,   0,   0,   0,
    50,  50,  50,  50,  50,  50,  50,  50,
    10,  10,  20,  30,  30,  20,  10,  10,
     5,   5,  10,  25,  25,  10,   5,   5,
     0,   0,   0,  20,  20,   0,   0,   0,
     5,  -5, -10,   0,   0, -10,  -5,   5,
     5,  10,  10, -20, -20,  10,  10,   5,
     0,   0,   0,   0,   0,   0,   0,   0
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,   0,   5,   5,   0, -20, -40,
    -30,   5,  10,  15,  15,  10,   5, -30,
    -30,   0,  15,  20,  20,  15,   0, -30,
    -30,   5,  15,  20,  20,  15,   5, -30,
    -30,   0,  10,  15,  15,  10,   0, -30,
    -40, -20,   0,   0,   0,   0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,   5,   0,   0,   0,   0,   5, -10,
    -10,  10,  10,  10,  10,  10,  10, -10,
    -10,   0,  10,  10,  10,  10,   0, -10,
    -10,   5,   5,  10,  10,   5,   5, -10,
    -10,   0,   5,  10,  10,   5,   0, -10,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
  ],
  r: [
      0,   0,   0,   5,   5,   0,   0,   0,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
      5,  10,  10,  10,  10,  10,  10,   5,
      0,   0,   0,   0,   0,   0,   0,   0
  ],
  q: [
    -20, -10, -10,  -5,  -5, -10, -10, -20,
    -10,   0,   5,   0,   0,   0,   0, -10,
    -10,   5,   5,   5,   5,   5,   0, -10,
      0,   0,   5,   5,   5,   5,   0,  -5,
     -5,   0,   5,   5,   5,   5,   0,  -5,
    -10,   0,   5,   5,   5,   5,   0, -10,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -20, -10, -10,  -5,  -5, -10, -10, -20
  ],
  k: [
     20,  30,  10,   0,   0,  10,  30,  20,
     20,  20,   0,   0,   0,   0,  20,  20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30
  ]
};

const botLevels = {
  quick: { depth: 1, quiescenceDepth: 1, randomness: 0.45 },
  sharp: { depth: 2, quiescenceDepth: 2, randomness: 0.12 },
  deep: { depth: 3, quiescenceDepth: 3, randomness: 0.02 }
};
const playerStartSeconds = 300;
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

function mirroredIndex(index) {
  const row = Math.floor(index / 8);
  const col = index % 8;
  return (7 - row) * 8 + col;
}

function makeMove(game, move) {
  const next = new Chess(game.fen());
  next.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
  return next;
}

function scorePawnStructure(board) {
  const files = { w: Array(8).fill(0), b: Array(8).fill(0) };
  let score = 0;

  board.forEach((piece, index) => {
    if (piece?.type === 'p') {
      files[piece.color][index % 8] += 1;
    }
  });

  board.forEach((piece, index) => {
    if (piece?.type !== 'p') return;

    const file = index % 8;
    const colorScore = piece.color === 'b' ? 1 : -1;
    const doubled = files[piece.color][file] > 1 ? -14 : 0;
    const isolated = files[piece.color][file - 1] || files[piece.color][file + 1] ? 0 : -12;
    score += colorScore * (doubled + isolated);
  });

  return score;
}

function evaluatePosition(game) {
  if (game.isCheckmate()) {
    return game.turn() === 'b' ? -99999 : 99999;
  }

  if (game.isDraw()) {
    return 0;
  }

  const board = game.board().flat();
  const counts = {
    w: { b: 0, n: 0, q: 0, r: 0 },
    b: { b: 0, n: 0, q: 0, r: 0 }
  };

  let score = board.reduce((positionScore, piece, index) => {
    if (!piece) return positionScore;
    counts[piece.color][piece.type] = (counts[piece.color][piece.type] || 0) + 1;
    const positionalIndex = piece.color === 'w' ? index : mirroredIndex(index);
    const positional = pieceSquareTables[piece.type][positionalIndex];
    const value = pieceValues[piece.type] + positional;
    return piece.color === 'b' ? positionScore + value : positionScore - value;
  }, 0);

  if (counts.b.b >= 2) score += 35;
  if (counts.w.b >= 2) score -= 35;
  score += scorePawnStructure(board);

  const legalMoves = game.moves().length;
  score += game.turn() === 'b' ? legalMoves * 2 : -legalMoves * 2;
  if (game.inCheck()) score += game.turn() === 'w' ? 35 : -35;

  return score;
}

function movePriority(game, move) {
  let score = 0;

  if (move.captured) {
    score += 10 * pieceValues[move.captured] - pieceValues[move.piece];
  }

  if (move.promotion) score += pieceValues[move.promotion] || pieceValues.q;
  if (move.san.includes('+')) score += 80;
  if (move.san.includes('#')) score += 100000;
  if (move.flags.includes('k') || move.flags.includes('q')) score += 35;

  const next = makeMove(game, move);
  score += evaluatePosition(next) / 100;
  return score;
}

function orderedMoves(game, capturesOnly = false) {
  return game
    .moves({ verbose: true })
    .filter((move) => !capturesOnly || move.captured || move.promotion || move.san.includes('+'))
    .map((move) => ({ move, priority: movePriority(game, move) }))
    .sort((a, b) => b.priority - a.priority)
    .map(({ move }) => move);
}

function quiescence(game, alpha, beta, maximizingBlack, depth) {
  const standPat = evaluatePosition(game);

  if (depth === 0 || game.isGameOver()) {
    return standPat;
  }

  if (maximizingBlack) {
    if (standPat >= beta) return beta;
    let bestScore = Math.max(alpha, standPat);

    for (const move of orderedMoves(game, true)) {
      bestScore = Math.max(bestScore, quiescence(makeMove(game, move), bestScore, beta, false, depth - 1));
      if (bestScore >= beta) return beta;
    }

    return bestScore;
  }

  if (standPat <= alpha) return alpha;
  let bestScore = Math.min(beta, standPat);

  for (const move of orderedMoves(game, true)) {
    bestScore = Math.min(bestScore, quiescence(makeMove(game, move), alpha, bestScore, true, depth - 1));
    if (bestScore <= alpha) return alpha;
  }

  return bestScore;
}

function minimax(game, depth, alpha, beta, maximizingBlack, quiescenceDepth) {
  if (depth === 0 || game.isGameOver()) {
    return quiescence(game, alpha, beta, maximizingBlack, quiescenceDepth);
  }

  const moves = orderedMoves(game);

  if (maximizingBlack) {
    let bestScore = -Infinity;
    for (const move of moves) {
      bestScore = Math.max(bestScore, minimax(makeMove(game, move), depth - 1, alpha, beta, false, quiescenceDepth));
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    return bestScore;
  }

  let bestScore = Infinity;
  for (const move of moves) {
    bestScore = Math.min(bestScore, minimax(makeMove(game, move), depth - 1, alpha, beta, true, quiescenceDepth));
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) break;
  }
  return bestScore;
}

function chooseBotMove(game, level) {
  const moves = orderedMoves(game);
  if (!moves.length) return null;
  const settings = botLevels[level] || botLevels.deep;

  if (level === 'quick') {
    const shortList = moves.slice(0, Math.min(5, moves.length));
    return shortList[Math.floor(Math.random() * shortList.length)];
  }

  const rankedMoves = moves
    .map((move) => {
      const next = makeMove(game, move);
      const score = minimax(next, settings.depth - 1, -Infinity, Infinity, false, settings.quiescenceDepth);
      return { move, score };
    })
    .sort((a, b) => b.score - a.score);

  const topMove = rankedMoves[0];
  const secondMove = rankedMoves[1];
  if (secondMove && Math.random() < settings.randomness && topMove.score - secondMove.score < 90) {
    return secondMove.move;
  }

  return topMove.move;
}

function formatClock(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function describeGame(game, botThinking = false, timeExpired = false) {
  if (timeExpired) {
    return 'Time is up. The bot wins.';
  }

  if (botThinking) {
    return 'Bot is thinking as Black.';
  }

  if (game.isCheckmate()) {
    return game.turn() === 'w' ? 'Checkmate. The bot wins.' : 'Checkmate. You win.';
  }

  if (game.isDraw()) {
    return 'Draw. Good fight.';
  }

  if (game.inCheck()) {
    return game.turn() === 'w' ? 'Your king is in check.' : 'Bot is in check.';
  }

  return game.turn() === 'w' ? 'Your move as White.' : 'Bot is thinking as Black.';
}

function ChessBot({ onClose }) {
  const startingFen = useMemo(() => new Chess().fen(), []);
  const [fen, setFen] = useState(startingFen);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveLog, setMoveLog] = useState([]);
  const [level, setLevel] = useState('deep');
  const [botThinking, setBotThinking] = useState(false);
  const [playerTime, setPlayerTime] = useState(playerStartSeconds);
  const botTurnId = useRef(0);

  const game = useMemo(() => new Chess(fen), [fen]);
  const legalTargets = useMemo(() => {
    if (!selectedSquare || game.turn() !== 'w') return [];
    return game.moves({ square: selectedSquare, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare]);
  const timeExpired = playerTime <= 0;

  useEffect(() => {
    if (botThinking || timeExpired || game.isGameOver() || game.turn() !== 'w') return undefined;

    const timer = window.setInterval(() => {
      setPlayerTime((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [botThinking, game, timeExpired]);

  const handleSquareClick = (square, piece) => {
    if (botThinking || timeExpired || game.isGameOver() || game.turn() !== 'w') return;

    if (!selectedSquare) {
      if (piece?.color === 'w') setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (piece?.color === 'w' && !legalTargets.includes(square)) {
      setSelectedSquare(square);
      return;
    }

    const next = new Chess(fen);
    let playerMove = null;
    try {
      playerMove = next.move({ from: selectedSquare, to: square, promotion: 'q' });
    } catch {
      playerMove = null;
    }

    if (!playerMove) {
      setSelectedSquare(piece?.color === 'w' ? square : null);
      return;
    }

    const nextLog = [...moveLog, `White: ${playerMove.san}`];
    setMoveLog(nextLog);
    setSelectedSquare(null);
    setFen(next.fen());

    if (!next.isGameOver()) {
      const activeBotTurn = botTurnId.current + 1;
      botTurnId.current = activeBotTurn;
      setBotThinking(true);

      window.setTimeout(() => {
        if (botTurnId.current !== activeBotTurn) return;

        const botGame = new Chess(next.fen());
        const botMove = chooseBotMove(botGame, level);

        if (botTurnId.current !== activeBotTurn) return;

        if (botMove) {
          const reply = botGame.move({ from: botMove.from, to: botMove.to, promotion: botMove.promotion || 'q' });
          setMoveLog([...nextLog, `Black: ${reply.san}`]);
          setFen(botGame.fen());
        }

        setBotThinking(false);
      }, 80);
    }
  };

  const resetGame = () => {
    const fresh = new Chess();
    botTurnId.current += 1;
    setFen(fresh.fen());
    setSelectedSquare(null);
    setMoveLog([]);
    setBotThinking(false);
    setPlayerTime(playerStartSeconds);
  };

  const boardRows = game.board();
  const status = describeGame(game, botThinking, timeExpired);

  return (
    <div className="chess-modal-backdrop" role="presentation">
      <section className="chess-modal" role="dialog" aria-modal="true" aria-labelledby="chess-title">
        <button className="chess-close" onClick={onClose} type="button" aria-label="Close chess board">
          <X />
        </button>

        <div className="chess-header">
        </div>

        <div className={`clock-card ${playerTime <= 30 ? 'low-time' : ''}`}>
          <span>Your Clock</span>
          <strong>{formatClock(playerTime)}</strong>
        </div>

        <div className="chess-layout">
          <div className="chess-board" aria-label="Playable chess board">
            {boardRows.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const file = String.fromCharCode(97 + colIndex);
                const rank = 8 - rowIndex;
                const square = `${file}${rank}`;
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected = selectedSquare === square;
                const canMove = legalTargets.includes(square);
                const glyph = piece ? pieceGlyphs[`${piece.color}${piece.type}`] : '';

                return (
                  <button
                    key={square}
                    className={[
                      'chess-square',
                      isLight ? 'light' : 'dark',
                      isSelected ? 'selected' : '',
                      canMove ? 'target' : '',
                      piece?.color === 'w' ? 'white-piece' : 'black-piece'
                    ].join(' ')}
                    onClick={() => handleSquareClick(square, piece)}
                    aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
                  >
                    <span>{glyph}</span>
                    <small>{square}</small>
                  </button>
                );
              })
            )}
          </div>

          <aside className="chess-panel">
            <div className="bot-status">
              <Bot className="panel-icon" />
              <div>
                <h3>{status}</h3>
                <p>You play White. Select a piece, then choose a highlighted legal square.</p>
              </div>
            </div>

            <div className="difficulty-tabs" role="group" aria-label="Bot strength">
              {[
                ['quick', 'Quick'],
                ['sharp', 'Sharp'],
                ['deep', '1400']
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={level === value ? 'active' : ''}
                  onClick={() => setLevel(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <button className="reset-button" onClick={resetGame} type="button">
              <RotateCcw />
              New Game
            </button>

            <div className="move-list">
              <div className="move-list-title">
                <Swords />
                <h4>Move History</h4>
              </div>
              {moveLog.length ? (
                <ol>
                  {moveLog.map((move, index) => (
                    <li key={`${move}-${index}`}>{move}</li>
                  ))}
                </ol>
              ) : (
                <p>No moves yet.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

const App = () => {
  const [chessOpen, setChessOpen] = useState(false);
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

  return (
    <div className="portfolio">
      {/* NAVIGATION */}
      <nav className="navbar">
        <div className="nav-logo">AJ</div>
        <div className="nav-links">
          <a href="#skills">Skills</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero">
        <motion.div {...fadeIn}>
          <h1>I'm Achintya Jaimini</h1>
          <br></br>
          <span className="badge">Computer Science @ UC Davis</span>
          
          <p className="hero-bio">
            Specializing in web development and scalable systems. 
            Passionate about building efficient and reliable software infrastructure.
          </p>
          <div className="social-links">
            <br></br>
            <a href="https://www.linkedin.com/in/achintya-jaimini/" target="_blank" rel="noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0077B5">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg></a>
  <br></br>
            {/* <button className="play-chess-button" onClick={() => setChessOpen(true)} type="button">
              Play Timed Chess
            </button> */}
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
            <div className="timeline-date">2025 - Present</div>
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
              <p>Managing conflict resolution and hosting events for residents in the community.</p>
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

      <Chatbot />
      {chessOpen && <ChessBot onClose={() => setChessOpen(false)} />}

      <footer className="footer">
        <p>© 2026 Achintya Jaimini</p>
      </footer>
    </div>
  );
};

export default App;
