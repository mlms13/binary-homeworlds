import React from 'react';
import './SetupInstructions.css';

interface SetupInstructionsProps {
  currentPlayer: string;
  step: 'select-stars' | 'select-ship' | 'waiting' | 'complete';
  selectedStars: number;
  selectedShip: boolean;
}

const SetupInstructions: React.FC<SetupInstructionsProps> = ({
  currentPlayer,
  step,
  selectedStars,
  selectedShip,
}) => {
  const isYourTurn = currentPlayer === 'player1';

  const getInstructionText = () => {
    if (!isYourTurn) {
      return 'Waiting for opponent to complete setup...';
    }

    switch (step) {
      case 'select-stars':
        return `Select ${2 - selectedStars} more star${
          2 - selectedStars === 1 ? '' : 's'
        } from the bank to create your home system`;
      case 'select-ship':
        return 'Select 1 ship from the bank to place in your home system';
      case 'waiting':
        return 'Waiting for opponent...';
      case 'complete':
        return 'Setup complete! Game will begin shortly.';
      default:
        return 'Setting up the game...';
    }
  };

  const getProgressText = () => {
    if (!isYourTurn) return '';

    switch (step) {
      case 'select-stars':
        return `Stars selected: ${selectedStars}/2`;
      case 'select-ship':
        return `Ship selected: ${selectedShip ? '1/1' : '0/1'}`;
      default:
        return '';
    }
  };

  return (
    <div
      className={`setup-instructions ${isYourTurn ? 'your-turn' : 'waiting'}`}
    >
      <div className="setup-header">
        <h3>Game Setup</h3>
        <div className="setup-player">
          {isYourTurn ? 'Your Turn' : "Opponent's Turn"}
        </div>
      </div>

      <div className="setup-content">
        <div className="instruction-text">{getInstructionText()}</div>

        {getProgressText() && (
          <div className="progress-text">{getProgressText()}</div>
        )}

        <div className="setup-hint">
          💡 Click pieces in the bank to select them
        </div>
      </div>
    </div>
  );
};

export default SetupInstructions;
