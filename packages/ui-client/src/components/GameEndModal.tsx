import React from 'react';

import { Player } from '@binary-homeworlds/shared';

import './GameEndModal.css';

interface GameEndModalProps {
  winner: Player;
  onNewGame: () => void;
}

const GameEndModal: React.FC<GameEndModalProps> = ({ winner, onNewGame }) => {
  const winnerName = winner === 'player1' ? 'Player 1' : 'Player 2';

  return (
    <div className="game-end-overlay">
      <div className="game-end-modal">
        <div className="game-end-header">
          <h2>Game Over!</h2>
        </div>
        <div className="game-end-content">
          <div className="winner-announcement">
            <div className="winner-icon">🏆</div>
            <div className="winner-text">
              <span className="winner-name">{winnerName}</span> wins!
            </div>
          </div>
          <p className="game-end-message">
            Congratulations to {winnerName} for achieving victory!
          </p>
        </div>
        <div className="game-end-actions">
          <button className="new-game-btn" onClick={onNewGame}>
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameEndModal;
