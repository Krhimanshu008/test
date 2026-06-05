import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const ChessApp = () => {
  const [game, setGame] = useState(new Chess());

  function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    const result = gameCopy.move(move);
    setGame(gameCopy);
    return result; 
  }

  function makeRandomMove() {
    const possibleMoves = game.moves();
    if (game.game_over() || game.in_draw() || possibleMoves.length === 0) return;
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    makeAMove(possibleMoves[randomIndex]);
  }

  function onDrop(sourceSquare, targetSquare) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', 
    });

    if (move === null) return false;
    setTimeout(makeRandomMove, 200);
    return true;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#2b2b2b' }}>
      <div style={{ width: '400px', maxWidth: '100%' }}>
        <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      </div>
      <button 
        onClick={() => setGame(new Chess())} 
        style={{ marginTop: '20px', padding: '8px 16px', background: '#0067C0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Reset Game
      </button>
    </div>
  );
};

export default ChessApp;
