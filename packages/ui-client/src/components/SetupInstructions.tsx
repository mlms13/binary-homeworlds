import React from 'react';
import GameHint from './GameHint';
import './SetupInstructions.css';

interface SetupInstructionsProps {
  currentPlayer: string;
  currentStep:
    | 'p1-star1'
    | 'p2-star1'
    | 'p1-star2'
    | 'p2-star2'
    | 'p1-ship'
    | 'p2-ship'
    | 'complete';
  player1Stars: number;
  player2Stars: number;
  player1Ship: boolean;
  player2Ship: boolean;
}

const SetupInstructions: React.FC<SetupInstructionsProps> = ({
  currentPlayer,
  currentStep,
  player1Stars: _player1Stars,
  player2Stars: _player2Stars,
  player1Ship: _player1Ship,
  player2Ship: _player2Ship,
}) => {
  const isYourTurn = currentPlayer === 'player1';

  const getInstructionText = () => {
    switch (currentStep) {
      case 'p1-star1':
        return isYourTurn
          ? 'Select your first star from the bank'
          : 'Player 1 is selecting their first star...';
      case 'p2-star1':
        return isYourTurn
          ? 'Player 1 selected their first star. Waiting for your turn...'
          : 'Select your first star from the bank';
      case 'p1-star2':
        return isYourTurn
          ? 'Select your second star from the bank'
          : 'Player 1 is selecting their second star...';
      case 'p2-star2':
        return isYourTurn
          ? 'Player 1 completed their stars. Waiting for your turn...'
          : 'Select your second star from the bank';
      case 'p1-ship':
        return isYourTurn
          ? 'Select your starting ship from the bank'
          : 'Player 1 is selecting their starting ship...';
      case 'p2-ship':
        return isYourTurn
          ? 'Player 1 completed their setup. Waiting for your turn...'
          : 'Select your starting ship from the bank';
      case 'complete':
        return 'Setup complete! Game will begin shortly.';
      default:
        return 'Setting up the game...';
    }
  };

  const getProgressText = () => {
    // Simplified progress - no detailed tracking needed since pieces show in home systems
    return '';
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

        <GameHint>Click pieces in the bank to select them</GameHint>
      </div>
    </div>
  );
};

export default SetupInstructions;
