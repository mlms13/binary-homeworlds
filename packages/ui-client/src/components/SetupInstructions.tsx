import React from 'react';

import { Player } from '@binary-homeworlds/shared';

import './SetupInstructions.css';

interface SetupInstructionsProps {
  currentPlayer: Player;
  currentStep: 'star1' | 'star2' | 'ship' | null;
}

const SetupInstructions: React.FC<SetupInstructionsProps> = ({
  currentPlayer: _currentPlayer,
  currentStep,
}) => {
  const getStepDescription = (step: 'star1' | 'star2' | 'ship') => {
    switch (step) {
      case 'star1':
        return 'Select your first star to create your home system';
      case 'star2':
        return 'Select your second star to add to your home system';
      case 'ship':
        return 'Select your starting ship to place in your home system';
      default:
        return '';
    }
  };

  const getStepNumber = (step: 'star1' | 'star2' | 'ship') => {
    switch (step) {
      case 'star1':
        return 1;
      case 'star2':
        return 2;
      case 'ship':
        return 3;
      default:
        return 0;
    }
  };

  if (!currentStep) return null;

  return (
    <div className="setup-instructions">
      <div className="setup-header">
        <h3>Setup Phase</h3>
        <div className="setup-progress">
          <span className="current-step">
            Step {getStepNumber(currentStep)} of 3
          </span>
        </div>
      </div>

      <div className="setup-content">
        <div className="setup-description">
          <p>{getStepDescription(currentStep)}</p>
        </div>

        <div className="setup-steps">
          <div
            className={`setup-step ${currentStep === 'star1' ? 'active' : ''}`}
          >
            <div className="step-number">1</div>
            <div className="step-text">First Star</div>
          </div>
          <div
            className={`setup-step ${currentStep === 'star2' ? 'active' : ''}`}
          >
            <div className="step-number">2</div>
            <div className="step-text">Second Star</div>
          </div>
          <div
            className={`setup-step ${currentStep === 'ship' ? 'active' : ''}`}
          >
            <div className="step-number">3</div>
            <div className="step-text">Starting Ship</div>
          </div>
        </div>

        <div className="setup-tip">
          <strong>Tip:</strong> Choose pieces that work well together. Your home
          system will be your base of operations!
        </div>
      </div>
    </div>
  );
};

export default SetupInstructions;
