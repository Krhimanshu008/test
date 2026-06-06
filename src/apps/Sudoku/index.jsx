import React, { useState, useEffect } from 'react';
import * as sudoku from 'sudoku';

const SudokuApp = () => {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    const puzzle = sudoku.makepuzzle();
    setBoard(puzzle);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#f0f0f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 30px)', gap: '1px', backgroundColor: '#333', border: '2px solid #333' }}>
        {board.map((cell, idx) => (
          <div key={idx} style={{ 
            width: '30px', height: '30px', backgroundColor: 'white', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            borderRight: (idx % 3 === 2 && idx % 9 !== 8) ? '2px solid #333' : 'none',
            borderBottom: (Math.floor(idx / 9) % 3 === 2 && Math.floor(idx / 9) !== 8) ? '2px solid #333' : 'none',
          }}>
            {cell !== null ? <span style={{ fontWeight: 'bold' }}>{cell + 1}</span> : <input type="text" maxLength={1} style={{ width: '100%', height: '100%', border: 'none', textAlign: 'center', outline: 'none' }} />}
          </div>
        ))}
      </div>
      <button onClick={() => setBoard(sudoku.makepuzzle())} style={{ marginTop: '20px', padding: '8px 16px', background: '#0067C0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>New Game</button>
    </div>
  );
};

export default SudokuApp;
