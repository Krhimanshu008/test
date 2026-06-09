import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './style.css';

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

const uciToObj = (uci) => {
  const base = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) base.promotion = uci[4];
  return base;
};

async function fetchLichessPuzzle(type) {
  const res = await fetch(`https://lichess.org/api/puzzle/${type}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Lichess API returned ${res.status}`);
  return res.json();
}

function parseLichessPuzzle(data) {
  const { game, puzzle } = data;
  const fullGame = new Chess();
  fullGame.loadPgn(game.pgn);
  const allMoves = fullGame.history({ verbose: true });

  const board = new Chess();
  const limit = Math.min(puzzle.initialPly, allMoves.length);
  for (let i = 0; i < limit; i++) {
    board.move(allMoves[i].san);
  }

  return {
    game: board,
    playerColor: board.turn() === 'w' ? 'white' : 'black',
    solution: puzzle.solution,
    rating: puzzle.rating,
    themes: puzzle.themes || [],
    lichessUrl: `https://lichess.org/training/${puzzle.id}`,
  };
}

// ════════════════════════════════════════════════════════════
// CLICK-TO-MOVE BOARD — works reliably inside react-rnd windows
// ════════════════════════════════════════════════════════════

/**
 * Handles click-to-move interaction.
 * Returns { sqStyles, onSquareClick, onSquareRightClick, selectedSq }
 * Caller provides: game (Chess instance), onMove(from, to) callback, canMove bool
 */
function useClickToMove(game, onMove, canMove) {
  const [selectedSq, setSelectedSq]   = useState(null);
  const [optionSqs,  setOptionSqs]    = useState({});

  // Highlight legal moves for selected piece
  function showOptions(square) {
    const moves = game.moves({ square, verbose: true });
    if (!moves.length) return;
    const styles = {
      [square]: { backgroundColor: 'rgba(167, 139, 250, 0.5)' },
    };
    moves.forEach(m => {
      styles[m.to] = {
        background:
          game.get(m.to)
            ? 'radial-gradient(circle, rgba(220,38,38,0.4) 65%, transparent 65%)'
            : 'radial-gradient(circle, rgba(167,139,250,0.35) 30%, transparent 30%)',
        borderRadius: '50%',
      };
    });
    setOptionSqs(styles);
    setSelectedSq(square);
  }

  function clearSelection() {
    setSelectedSq(null);
    setOptionSqs({});
  }

  const onSquareClick = useCallback(({ square }) => {
    if (!canMove || !game) return;

    // If a piece is already selected
    if (selectedSq) {
      // Try moving to the clicked square
      const moves = game.moves({ square: selectedSq, verbose: true });
      const legalMove = moves.find(m => m.to === square);

      if (legalMove) {
        onMove(selectedSq, square, legalMove);
        clearSelection();
        return;
      }

      // Clicked own piece — switch selection
      const piece = game.get(square);
      if (piece && piece.color === game.turn()[0]) {
        showOptions(square);
        return;
      }

      clearSelection();
      return;
    }

    // No piece selected yet — select the clicked piece
    const piece = game.get(square);
    if (piece && piece.color === game.turn()[0]) {
      showOptions(square);
    }
  }, [game, selectedSq, canMove, onMove]);

  const onSquareRightClick = useCallback(() => clearSelection(), []);

  const sqStyles = { ...optionSqs };

  return { sqStyles, onSquareClick, onSquareRightClick, selectedSq, clearSelection };
}

// ════════════════════════════════════════════════════════════
// useBoardSize — responsive board sizing (fits width AND height)
// ════════════════════════════════════════════════════════════

function useBoardSize(ref) {
  const [size, setSize] = useState(330);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        // Vertical: status bar(28) + hint text(16) + gaps(12) ≈ 56px
        const maxByHeight = h - 56;
        // Horizontal: reserve ~300px for side panel + gap
        const maxByWidth = w - 300;
        setSize(Math.max(200, Math.min(maxByWidth, maxByHeight)));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return size;
}

// ════════════════════════════════════════════════════════════
// usePuzzle — shared puzzle logic hook
// ════════════════════════════════════════════════════════════

function usePuzzle() {
  const [parsed, setParsed]     = useState(null);
  const [game, setGame]         = useState(null);
  const [moveIdx, setMoveIdx]   = useState(0);
  const [status, _setStatus]    = useState('idle');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [feedbackSqs, setFeedbackSqs] = useState({});
  const [engineOn, setEngineOn] = useState(false);

  const setStatus = useCallback((s) => _setStatus(s), []);

  const loadPuzzle = useCallback(async (type) => {
    setLoading(true);
    setError(null);
    _setStatus('loading');
    setFeedbackSqs({});
    setEngineOn(false);
    setParsed(null);
    setGame(null);
    try {
      const data = await fetchLichessPuzzle(type);
      const p    = parseLichessPuzzle(data);
      setParsed(p);
      setGame(new Chess(p.game.fen()));
      setMoveIdx(0);
      _setStatus('playing');
    } catch (e) {
      setError(e.message);
      _setStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Called by click-to-move when user makes a move
  const handlePlayerMove = useCallback((from, to, legalMove) => {
    if (!game || !parsed || status !== 'playing' || engineOn) return;

    const expected = parsed.solution[moveIdx];
    if (!expected) return;

    const correct = from === expected.slice(0, 2) && to === expected.slice(2, 4);

    if (!correct) {
      setFeedbackSqs({
        [from]: { backgroundColor: 'rgba(220, 38, 38, 0.55)' },
        [to]:   { backgroundColor: 'rgba(220, 38, 38, 0.45)' },
      });
      setTimeout(() => setFeedbackSqs({}), 900);
      _setStatus('wrong');
      return;
    }

    // Correct — make the move
    const copy = new Chess(game.fen());
    const moveObj = expected.length > 4
      ? { from, to, promotion: expected[4] }
      : { from, to };
    const result = copy.move(moveObj);
    if (!result) return;

    setGame(copy);
    setFeedbackSqs({
      [from]: { backgroundColor: 'rgba(34, 197, 94, 0.45)' },
      [to]:   { backgroundColor: 'rgba(34, 197, 94, 0.55)' },
    });

    const opIdx       = moveIdx + 1;
    const nextPlyrIdx = moveIdx + 2;

    if (opIdx >= parsed.solution.length) {
      setTimeout(() => { _setStatus('complete'); setFeedbackSqs({}); }, 450);
      return;
    }

    // Auto-play opponent
    setEngineOn(true);
    const opUci = parsed.solution[opIdx];
    setTimeout(() => {
      const copy2 = new Chess(copy.fen());
      copy2.move(uciToObj(opUci));
      setGame(copy2);
      setFeedbackSqs({
        [opUci.slice(0, 2)]: { backgroundColor: 'rgba(96, 165, 250, 0.35)' },
        [opUci.slice(2, 4)]: { backgroundColor: 'rgba(96, 165, 250, 0.45)' },
      });
      setTimeout(() => {
        setFeedbackSqs({});
        setEngineOn(false);
        if (nextPlyrIdx >= parsed.solution.length) {
          _setStatus('complete');
        } else {
          setMoveIdx(nextPlyrIdx);
        }
      }, 700);
    }, 520);
  }, [game, parsed, moveIdx, status, engineOn]);

  return {
    parsed, game, moveIdx, status, loading, error,
    feedbackSqs, engineOn, loadPuzzle, setStatus, handlePlayerMove,
  };
}

// ════════════════════════════════════════════════════════════
// FREE PLAY MODE — Human (White) vs Random AI
// ════════════════════════════════════════════════════════════

function FreePlayMode() {
  const [game, setGame]          = useState(new Chess());
  const [history, setHistory]    = useState([]);
  const [aiThinking, setAiThink] = useState(false);
  const [feedbackSqs, setFeedbackSqs] = useState({});
  const [elo, setElo] = useState(1200);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./stockfish.worker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : '';
      if (line.startsWith('bestmove ')) {
        const moveStr = line.split(' ')[1];
        if (!moveStr || moveStr === '(none)') {
          setAiThink(false);
          return;
        }
        // e.g. 'e2e4' or 'e7e8q'
        const from = moveStr.substring(0, 2);
        const to = moveStr.substring(2, 4);
        const promotion = moveStr.length > 4 ? moveStr[4] : undefined;

        setGame(prev => {
          const copy = new Chess(prev.fen());
          const res = copy.move({ from, to, promotion });
          if (res) {
            setHistory(h => [...h, res.san]);
            setFeedbackSqs({
              [from]: { backgroundColor: 'rgba(167,139,250,0.28)' },
              [to]:   { backgroundColor: 'rgba(167,139,250,0.38)' },
            });
          }
          return copy;
        });
        setAiThink(false);
      }
    };
    return () => workerRef.current?.terminate();
  }, []);
  const containerRef = useRef(null);
  const bw = useBoardSize(containerRef);

  const isDone  = game.isGameOver();
  const canMove = !aiThinking && !isDone && game.turn() === 'w';

  function applyMove(from, to, legalMove) {
    const copy = new Chess(game.fen());
    // Handle pawn promotion
    const isPromo = legalMove?.flags?.includes('p');
    const moveObj = isPromo ? { from, to, promotion: 'q' } : { from, to };
    const result  = copy.move(moveObj);
    if (!result) return;

    setGame(copy);
    setHistory(h => [...h, result.san]);
    setFeedbackSqs({
      [from]: { backgroundColor: 'rgba(255,255,255,0.14)' },
      [to]:   { backgroundColor: 'rgba(255,255,255,0.24)' },
    });

    if (!copy.isGameOver()) {
      setAiThink(true);
      workerRef.current?.postMessage('uci');
      workerRef.current?.postMessage('setoption name UCI_LimitStrength value true');
      workerRef.current?.postMessage(`setoption name Elo value ${elo}`);
      workerRef.current?.postMessage(`position fen ${copy.fen()}`);
      workerRef.current?.postMessage('go depth 10');
    }
  }

  const { sqStyles, onSquareClick, onSquareRightClick } = useClickToMove(game, applyMove, canMove);
  const combinedStyles = { ...sqStyles, ...feedbackSqs };

  const getStatus = (g) => {
    if (g.isCheckmate()) return `♚ Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins`;
    if (g.isStalemate()) return '🤝 Stalemate — Draw';
    if (g.isDraw())      return '🤝 Draw';
    if (g.isCheck())     return `⚠️ ${g.turn() === 'w' ? 'White' : 'Black'} is in check!`;
    return aiThinking ? '⏳ AI is thinking…' : `${g.turn() === 'w' ? '♔ White' : '♚ Black'} to move`;
  };

  const statusClass = isDone ? (game.isCheckmate() ? 'complete' : '') : (game.isCheck() && !game.isCheckmate() ? 'check' : '');

  function reset() {
    setGame(new Chess());
    setHistory([]);
    setFeedbackSqs({});
    setAiThink(false);
  }

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ n: Math.floor(i / 2) + 1, w: history[i], b: history[i + 1] });
  }

  return (
    <div className="mode-container" ref={containerRef}>
      <div className="board-section" style={{ width: bw }}>
        <div className="board-wrapper" style={{ width: bw, height: bw }}>
          <Chessboard
            options={{
              position: game.fen(),
              squareStyles: combinedStyles,
              onSquareClick: onSquareClick,
              onSquareRightClick: onSquareRightClick,
              allowDragging: false,
            }}
          />
        </div>
        <div className={`board-status ${statusClass}`}>{getStatus(game)}</div>
        <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.3)', marginTop: 2 }}>
          Click a piece, then click the destination square
        </div>
      </div>

      <div className="info-section">
        <div className="glass-panel">
          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Free Play
            <select
              value={elo}
              onChange={(e) => setElo(Number(e.target.value))}
              className="elo-select"
              disabled={aiThinking || history.length > 0}
            >
              <option value={800}>Beginner (800)</option>
              <option value={1200}>Intermediate (1200)</option>
              <option value={1600}>Advanced (1600)</option>
              <option value={2000}>Master (2000)</option>
              <option value={3000}>Grandmaster (3000)</option>
            </select>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.38)', marginTop: 8 }}>
            You play <strong style={{ color: '#e2e8f0' }}>White</strong> vs Stockfish
          </div>
        </div>

        <div className="glass-panel flex-grow">
          <div className="panel-title">Move History</div>
          <div className="move-history-scroll">
            {pairs.length === 0 && (
              <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.25)', paddingTop: 4 }}>
                Click a white piece to start…
              </div>
            )}
            {pairs.map(({ n, w, b }) => (
              <div key={n} className="move-pair">
                <span className="move-num">{n}.</span>
                <span className="move-san w">{w}</span>
                <span className="move-san b">{b || ''}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={reset}>↺ New Game</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PUZZLE BOARD — shared between Rush and Daily modes
// ════════════════════════════════════════════════════════════

function PuzzleBoard({ pz, bw }) {
  const canMove = pz.status === 'playing' && !pz.engineOn;

  const { sqStyles, onSquareClick, onSquareRightClick, clearSelection } = useClickToMove(
    pz.game,
    pz.handlePlayerMove,
    canMove,
  );

  // Clear selection when engine plays (board changes)
  useEffect(() => {
    clearSelection();
  }, [pz.game?.fen()]);

  const combinedStyles = { ...sqStyles, ...pz.feedbackSqs };

  if (pz.loading && !pz.game) {
    return (
      <div className="loading-state" style={{ width: bw, height: bw }}>
        <div className="spinner" />
        Loading puzzle…
      </div>
    );
  }

  if (pz.status === 'error') {
    return (
      <div className="error-state" style={{ width: bw, height: bw }}>
        <div style={{ fontSize: 28 }}>⚠️</div>
        <div>Could not load puzzle</div>
        <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.35)' }}>{pz.error}</div>
      </div>
    );
  }

  return (
    <div className="board-section" style={{ width: bw }}>
      <div className="board-wrapper" style={{ width: bw, height: bw }}>
        <Chessboard
          options={{
            position: pz.game?.fen() || 'start',
            boardOrientation: pz.parsed?.playerColor || 'white',
            squareStyles: combinedStyles,
            onSquareClick: onSquareClick,
            onSquareRightClick: onSquareRightClick,
            allowDragging: false,
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.3)', marginTop: 2 }}>
        Click a piece, then click the destination
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PUZZLE RUSH MODE
// ════════════════════════════════════════════════════════════

const RUSH_SECS    = 60;
const TIME_BONUS   = 8;
const TIME_PENALTY = 5;

function PuzzleRushMode() {
  const pz = usePuzzle();
  const [phase, setPhase]         = useState('idle');
  const [timeLeft, setTimeLeft]   = useState(RUSH_SECS);
  const [score, setScore]         = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('chessRushBest') || '0', 10); } catch { return 0; }
  });
  const timerRef   = useRef(null);
  const prevStatus = useRef(null);
  const containerRef = useRef(null);
  const bw         = useBoardSize(containerRef);

  async function startRush() {
    setScore(0);
    setTimeLeft(RUSH_SECS);
    prevStatus.current = null;
    setPhase('running');
    pz.loadPuzzle('next');
  }

  useEffect(() => {
    if (phase !== 'running') { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setPhase('over'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'running') return;
    if (pz.status === prevStatus.current) return;
    prevStatus.current = pz.status;

    if (pz.status === 'complete') {
      setScore(s => s + 1);
      setTimeLeft(t => Math.min(t + TIME_BONUS, RUSH_SECS));
      const t = setTimeout(() => { prevStatus.current = null; pz.loadPuzzle('next'); }, 900);
      return () => clearTimeout(t);
    }
    if (pz.status === 'wrong') {
      setTimeLeft(t => Math.max(t - TIME_PENALTY, 0));
      const t = setTimeout(() => { prevStatus.current = null; pz.loadPuzzle('next'); }, 1400);
      return () => clearTimeout(t);
    }
  }, [pz.status, phase]);

  useEffect(() => {
    if (phase !== 'over') return;
    setBestScore(prev => {
      const nb = Math.max(prev, score);
      try { localStorage.setItem('chessRushBest', String(nb)); } catch {}
      return nb;
    });
  }, [phase]);

  const pct    = (timeLeft / RUSH_SECS) * 100;
  const danger = timeLeft <= 15;

  const statusMsg = {
    playing:  `Find the best move for ${pz.parsed?.playerColor === 'white' ? '♔ White' : '♚ Black'}`,
    complete: '✅ Brilliant! Loading next…',
    wrong:    '❌ Wrong — loading next…',
    loading:  'Fetching puzzle…',
    error:    '⚠️ Retrying…',
  };

  const renderPhase = () => {
    if (phase === 'idle') return (
      <div className="mode-container centered">
        <div className="idle-screen">
          <div className="idle-icon">⚡</div>
          <h2 className="idle-title">Puzzle Rush</h2>
          <p className="idle-desc">
            Solve Lichess puzzles as fast as you can!<br />
            <strong>+{TIME_BONUS}s</strong> per correct &nbsp;·&nbsp; <strong>−{TIME_PENALTY}s</strong> per mistake
          </p>
          {bestScore > 0 && <div className="best-score-pill">🏆 Best: {bestScore}</div>}
          <button className="btn-primary start-btn" onClick={startRush}>▶ Start 60s Rush</button>
        </div>
      </div>
    );

    if (phase === 'over') return (
      <div className="mode-container centered">
        <div className="gameover-screen">
          <div className="gameover-icon">🏁</div>
          <h2 className="gameover-title">Time's Up!</h2>
          <div className="gameover-big-score">{score}</div>
          <div className="gameover-label">puzzles solved</div>
          {score > 0 && score >= bestScore && <div className="new-record">🎉 New Personal Best!</div>}
          <div className="gameover-stats">All-time best: <strong>{bestScore}</strong></div>
          <button className="btn-primary" style={{ maxWidth: 200, marginTop: 16 }} onClick={startRush}>
            ▶ Play Again
          </button>
        </div>
      </div>
    );

    return (
      <div className="mode-container">
        <PuzzleBoard pz={pz} bw={bw} />

        <div className="info-section">
          {/* Status bar */}
          <div className={`board-status ${pz.status === 'complete' ? 'complete' : pz.status === 'wrong' ? 'wrong' : ''}`}
               style={{ fontSize: 13, padding: '10px 14px' }}>
            {statusMsg[pz.status] || ''}
          </div>

          <div className="glass-panel" style={{ flex: 'none' }}>
            <div className="rush-stats">
              <div className="stat-box">
                <div className="stat-label">SCORE</div>
                <div className={`stat-val ${pz.status === 'complete' ? 'pulse-green' : ''}`}>{score}</div>
              </div>
              <div className="stat-line" />
              <div className="stat-box">
                <div className="stat-label">BEST</div>
                <div className="stat-val gold">{bestScore}</div>
              </div>
            </div>
          </div>

          <div className="glass-panel flex-grow">
            <div className="panel-title" style={{ marginBottom: 4, opacity: 0.7, fontSize: 10 }}>CURRENT PUZZLE</div>
            {pz.parsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(226,232,240,0.5)' }}>Rating</span>
                  <span className="gold" style={{ fontWeight: 600 }}>⭐ {pz.parsed.rating}</span>
                </div>
                {pz.parsed.themes.length > 0 && (
                  <div className="themes-list" style={{ marginTop: 4 }}>
                    {pz.parsed.themes.slice(0, 3).map(t => (
                      <span key={t} className="theme-badge">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.3)', fontStyle: 'italic' }}>Loading…</div>
            )}
          </div>

          <button className="btn-secondary" style={{ marginTop: 'auto', padding: 8 }} onClick={() => setPhase('over')}>
            ⏹ End Rush
          </button>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {renderPhase()}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DAILY PUZZLE MODE
// ════════════════════════════════════════════════════════════

function DailyPuzzleMode() {
  const pz          = usePuzzle();
  const [attempts, setAttempts] = useState(0);
  const prevStatus  = useRef(null);
  const containerRef = useRef(null);
  const bw          = useBoardSize(containerRef);

  useEffect(() => { pz.loadPuzzle('daily'); }, []);

  useEffect(() => {
    if (pz.status === prevStatus.current) return;
    prevStatus.current = pz.status;
    if (pz.status === 'wrong') {
      setAttempts(a => a + 1);
      const t = setTimeout(() => {
        prevStatus.current = null;
        pz.setStatus('playing');
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [pz.status]);

  const isSolved = pz.status === 'complete';

  function reload() {
    setAttempts(0);
    prevStatus.current = null;
    pz.loadPuzzle('daily');
  }

  const statusMsg = {
    playing:  `Find the best move for ${pz.parsed?.playerColor === 'white' ? '♔ White' : '♚ Black'}`,
    wrong:    '❌ Incorrect — try again',
    complete: '✅ Puzzle Solved!',
    loading:  'Loading…',
    error:    'Failed to load',
  };

  return (
    <div className="mode-container" ref={containerRef}>
      <PuzzleBoard pz={pz} bw={bw} />

      <div className="info-section">
        {/* Status */}
        <div className={`board-status ${isSolved ? 'complete' : pz.status === 'wrong' ? 'wrong' : ''}`}>
          {statusMsg[pz.status] || ''}
        </div>

        <div className="glass-panel">
          <div className="daily-badge">📅 Lichess Daily Puzzle</div>
          <div style={{ fontSize: 11.5, color: 'rgba(226,232,240,0.38)', marginTop: 3 }}>
            A fresh hand-picked puzzle every day
          </div>
        </div>

        {pz.parsed && (
          <div className="glass-panel">
            <div className="info-row">
              <span className="info-label">Rating</span>
              <span className="info-val gold">⭐ {pz.parsed.rating}</span>
            </div>
            <div className="info-row" style={{ marginTop: 8 }}>
              <span className="info-label">Attempts</span>
              <span className="info-val">{attempts}</span>
            </div>
            {pz.parsed.themes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="panel-title">Themes</div>
                <div className="themes-list">
                  {pz.parsed.themes.map(t => (
                    <span key={t} className="theme-badge">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {pz.status === 'error' && (
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <div style={{ color: '#f87171', marginBottom: 8 }}>⚠️ Could not load puzzle</div>
            <button className="btn-secondary" style={{ width: 'auto', padding: '7px 16px' }} onClick={reload}>Retry</button>
          </div>
        )}

        {isSolved && (
          <div className="glass-panel">
            <div className="solved-celebration">
              <div className="solved-title">🎉 Solved!</div>
              <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.45)', marginTop: 4 }}>
                {attempts === 0 ? 'First try!' : `${attempts + 1} attempts`}
              </div>
              <a className="lichess-link" href={pz.parsed?.lichessUrl} target="_blank" rel="noopener noreferrer">
                View on Lichess ↗
              </a>
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button className="btn-secondary" onClick={reload}>↺ Reload Puzzle</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ERROR BOUNDARY — prevents white-screen crashes
// ════════════════════════════════════════════════════════════

class ChessErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state" style={{ width: '100%', height: '100%' }}>
          <div style={{ fontSize: 28 }}>⚠️</div>
          <div>Something went wrong</div>
          <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.35)', maxWidth: 280, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button
            className="btn-secondary"
            style={{ width: 'auto', padding: '7px 16px', marginTop: 8 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ════════════════════════════════════════════════════════════
// MAIN CHESS APP
// ════════════════════════════════════════════════════════════

const TABS = [
  { id: 'freeplay', label: '♟ Free Play'    },
  { id: 'rush',     label: '⚡ Puzzle Rush'  },
  { id: 'daily',    label: '📅 Daily Puzzle' },
];

export default function ChessApp() {
  const [tab, setTab] = useState('freeplay');

  return (
    <div className="chess-app">
      <div className="chess-tabs-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`chess-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <ChessErrorBoundary key={tab}>
          {tab === 'freeplay' && <FreePlayMode />}
          {tab === 'rush'     && <PuzzleRushMode />}
          {tab === 'daily'    && <DailyPuzzleMode />}
        </ChessErrorBoundary>
      </div>
    </div>
  );
}
