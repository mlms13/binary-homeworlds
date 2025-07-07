import React from 'react';
import { createPortal } from 'react-dom';
import { GameAction } from '../../../src/types';
import './GameLossWarningModal.css';

interface GameLossWarningModalProps {
  action: GameAction;
  warningMessage: string;
  onProceed: () => void;
  onCancel: () => void;
}

const GameLossWarningModal: React.FC<GameLossWarningModalProps> = ({
  action,
  warningMessage,
  onProceed,
  onCancel,
}) => {
  const getActionDescription = (action: GameAction): string => {
    switch (action.type) {
      case 'move':
        return 'move a ship';
      case 'capture':
        return 'capture a ship';
      case 'grow':
        return 'grow a new ship';
      case 'trade':
        return 'trade a ship';
      case 'sacrifice':
        return 'sacrifice a ship';
      case 'overpopulation':
        return 'declare overpopulation';
      default:
        return 'take this action';
    }
  };

  return createPortal(
    <div className="game-loss-warning-modal-overlay">
      <div className="game-loss-warning-modal">
        <div className="game-loss-warning-header">
          <h2 className="game-loss-warning-title">
            ⚠️ Warning: Game Ending Action
          </h2>
        </div>

        <div className="game-loss-warning-content">
          <div className="warning-message">
            <p className="warning-text">{warningMessage}</p>
          </div>

          <div className="action-description">
            <p>
              You are about to <strong>{getActionDescription(action)}</strong>.
            </p>
            <p>Are you sure you want to proceed with this action?</p>
          </div>

          <div className="loss-explanation">
            <h4>Binary Homeworlds Loss Conditions:</h4>
            <ul>
              <li>
                You lose if you have <strong>no ships</strong> at your home
                system
              </li>
              <li>
                You lose if you have <strong>no stars</strong> at your home
                system
              </li>
              <li>The game ends immediately when either condition is met</li>
            </ul>
          </div>
        </div>

        <div className="game-loss-warning-actions">
          <button className="proceed-btn" onClick={onProceed}>
            Proceed Anyway
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            Cancel Action
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GameLossWarningModal;
