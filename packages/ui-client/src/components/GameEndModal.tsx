import React from 'react';
import { createPortal } from 'react-dom';

import './GameEndModal.css';

interface GameEndModalProps {
  winner: 'player1' | 'player2';
  onNewGame: () => void;
}

const GameEndModal: React.FC<GameEndModalProps> = ({ winner, onNewGame }) => {
  const getWinnerName = (player: 'player1' | 'player2'): string => {
    return player === 'player1' ? 'Player 1' : 'Player 2';
  };

  const getWinnerColor = (player: 'player1' | 'player2'): string => {
    return player === 'player1' ? '#4ade80' : '#f87171';
  };

  return createPortal(
    <div className="game-end-modal-overlay">
      <div className="game-end-modal">
        <div className="game-end-header">
          <h1 className="game-end-title">Game Over!</h1>
        </div>

        <div className="game-end-content">
          <div
            className="winner-announcement"
            style={{ color: getWinnerColor(winner) }}
          >
            🎉 {getWinnerName(winner)} Wins! 🎉
          </div>

          <div className="win-condition-explanation">
            <h3>How the game ended:</h3>
            <p>
              The opponent lost because they have no ships at their home system
              or their home system has no stars remaining.
            </p>
            <p>
              In Binary Homeworlds, you lose if you cannot defend your home
              system or if your home system is completely destroyed.
            </p>
          </div>

          <div className="game-end-actions">
            <button className="new-game-btn" onClick={onNewGame}>
              Start New Game
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GameEndModal;
