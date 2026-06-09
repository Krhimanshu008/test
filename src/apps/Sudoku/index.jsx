import React, { useState, useEffect, useCallback } from 'react';
import * as sudoku from 'sudoku';
import { RefreshCw, CheckCircle } from 'lucide-react';
import './style.css';

const SudokuApp = () => {
  const [initialBoard, setInitialBoard] = useState(Array(81).fill(null));
  const [board, setBoard] = useState(Array(81).fill(null));
  const [selectedCell, setSelectedCell] = useState(null);
  const [isWon, setIsWon] = useState(false);

  const initGame = useCallback(() => {
    const puzzle = sudoku.makepuzzle();
    setInitialBoard([...puzzle]);
    setBoard([...puzzle]);
    setSelectedCell(null);
    setIsWon(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCellClick = (idx) => {
    if (isWon) return;
    setSelectedCell(idx);
  };

  const handleInput = useCallback((num) => {
    if (selectedCell === null || isWon) return;
    if (initialBoard[selectedCell] !== null) return; // Can't overwrite given cells

    const newBoard = [...board];
    newBoard[selectedCell] = num === null ? null : num;
    setBoard(newBoard);
    checkWin(newBoard);
  }, [selectedCell, isWon, initialBoard, board]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedCell === null || isWon) return;
      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key, 10) - 1);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput(null);
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        let row = Math.floor(selectedCell / 9);
        let col = selectedCell % 9;
        if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') row = Math.min(8, row + 1);
        if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') col = Math.min(8, col + 1);
        setSelectedCell(row * 9 + col);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, selectedCell, isWon]);

  const checkWin = (currentBoard) => {
    // If any cell is empty, not won
    if (currentBoard.some(cell => cell === null)) return;

    // Validate rows, cols, blocks
    for (let i = 0; i < 9; i++) {
      const row = new Set();
      const col = new Set();
      const block = new Set();

      for (let j = 0; j < 9; j++) {
        const rVal = currentBoard[i * 9 + j];
        const cVal = currentBoard[j * 9 + i];
        
        const bRow = Math.floor(i / 3) * 3 + Math.floor(j / 3);
        const bCol = (i % 3) * 3 + (j % 3);
        const bVal = currentBoard[bRow * 9 + bCol];

        if (row.has(rVal) || col.has(cVal) || block.has(bVal)) {
          return; // Duplicate found, not won
        }
        
        row.add(rVal);
        col.add(cVal);
        block.add(bVal);
      }
    }
    
    setIsWon(true);
  };

  const getHighlights = (idx) => {
    if (selectedCell === null) return false;
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    const sRow = Math.floor(selectedCell / 9);
    const sCol = selectedCell % 9;
    
    const isSameRow = row === sRow;
    const isSameCol = col === sCol;
    const isSameBlock = Math.floor(row / 3) === Math.floor(sRow / 3) && Math.floor(col / 3) === Math.floor(sCol / 3);
    
    return isSameRow || isSameCol || isSameBlock;
  };

  const isError = (idx, val) => {
    if (val === null) return false;
    // Check row, col, block for duplicates
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    const blockRowStart = Math.floor(row / 3) * 3;
    const blockColStart = Math.floor(col / 3) * 3;

    for (let i = 0; i < 9; i++) {
      // Check row
      if (i !== col && board[row * 9 + i] === val) return true;
      // Check col
      if (i !== row && board[i * 9 + col] === val) return true;
      // Check block
      const r = blockRowStart + Math.floor(i / 3);
      const c = blockColStart + (i % 3);
      const bIdx = r * 9 + c;
      if (bIdx !== idx && board[bIdx] === val) return true;
    }
    return false;
  };

  const solveGame = () => {
    const solved = sudoku.solvepuzzle(initialBoard);
    if (solved) {
      setBoard([...solved]);
      // We don't set 'isWon(true)' here so the user can actually see the answer
      // without the overlay blocking it, and because they didn't win by themselves!
    }
  };

  return (
    <div className="sudoku-app">
      <div style={{ margin: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="sudoku-header">
          <h2>Sudoku</h2>
          <div className="sudoku-controls">
            <button className="sudoku-btn" onClick={solveGame} title="Solve">
              <CheckCircle size={16} /> Solve
            </button>
            <button className="sudoku-btn primary" onClick={initGame}>
              <RefreshCw size={16} /> New
            </button>
          </div>
        </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
        <div className="sudoku-board">
          {board.map((cell, idx) => {
            const isRightBorder = idx % 3 === 2 && idx % 9 !== 8;
            const isBottomBorder = Math.floor(idx / 9) % 3 === 2 && Math.floor(idx / 9) !== 8;
            
            return (
              <div 
                key={idx} 
                className={`sudoku-cell 
                  ${initialBoard[idx] !== null ? 'given' : 'user-input'} 
                  ${selectedCell === idx ? 'selected' : ''} 
                  ${selectedCell !== idx && getHighlights(idx) ? 'highlighted' : ''}
                  ${isError(idx, cell) ? 'error' : ''}
                  ${isRightBorder ? 'border-right' : ''}
                  ${isBottomBorder ? 'border-bottom' : ''}
                `}
                onClick={() => handleCellClick(idx)}
              >
                {cell !== null ? cell + 1 : ''}
              </div>
            );
          })}
        </div>
        
        {isWon && (
          <div className="win-overlay">
            <h2>You Win!</h2>
            <button className="sudoku-btn primary" onClick={initGame} style={{ fontSize: '1.2rem', padding: '12px 24px' }}>
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} className="numpad-btn" onClick={() => handleInput(num - 1)}>
            {num}
          </button>
        ))}
        <button className="numpad-btn" onClick={() => handleInput(null)} style={{ color: '#e81123' }}>
          Del
        </button>
      </div>
      </div>
    </div>
  );
};

export default SudokuApp;
