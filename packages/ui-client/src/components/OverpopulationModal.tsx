import React from 'react';
import { createPortal } from 'react-dom';

import { GamePiece } from '@binary-homeworlds/engine';

import './OverpopulationModal.css';

interface OverpopulationModalProps {
  systemId: string;
  color: GamePiece.Color;
  currentPlayer: 'player1' | 'player2';
  currentPlayerPrompted: boolean;
  otherPlayerPrompted: boolean;
  onDeclareOverpopulation: () => void;
  onIgnoreOverpopulation: () => void;
}

const OverpopulationModal: React.FC<OverpopulationModalProps> = ({
  systemId,
  color,
  currentPlayer,
  currentPlayerPrompted,
  otherPlayerPrompted: _otherPlayerPrompted,
  onDeclareOverpopulation,
  onIgnoreOverpopulation,
}) => {
  const getColorName = (color: GamePiece.Color): string => {
    const colorNames = {
      yellow: 'Yellow',
      green: 'Green',
      blue: 'Blue',
      red: 'Red',
    };
    return colorNames[color];
  };

  const getPlayerName = (player: 'player1' | 'player2'): string => {
    return player === 'player1' ? 'Player 1' : 'Player 2';
  };

  const getCurrentPromptPlayer = (): 'player1' | 'player2' => {
    // If current player hasn't been prompted yet, prompt them first
    if (!currentPlayerPrompted) {
      return currentPlayer;
    }
    // Otherwise prompt the other player
    return currentPlayer === 'player1' ? 'player2' : 'player1';
  };

  const promptPlayer = getCurrentPromptPlayer();
  const isCurrentPlayerTurn = promptPlayer === currentPlayer;

  return createPortal(
    <div className="overpopulation-modal-overlay">
      <div className="overpopulation-modal">
        <div className="overpopulation-header">
          <h2 className="overpopulation-title">Overpopulation Detected!</h2>
        </div>

        <div className="overpopulation-content">
          <div className="overpopulation-info">
            <div className="overpopulation-description">
              <p>
                A star system contains{' '}
                <strong>
                  4 or more {getColorName(color).toLowerCase()} pieces
                </strong>
                .
              </p>
              <p>
                Either player may declare overpopulation to remove all{' '}
                {getColorName(color).toLowerCase()} pieces from the system and
                return them to the bank.
              </p>
            </div>

            <div className="system-info">
              <h4>System: {systemId}</h4>
              <h4>
                Overpopulating Color:{' '}
                <span style={{ color: getColorDisplayColor(color) }}>
                  {getColorName(color)}
                </span>
              </h4>
            </div>
          </div>

          <div className="player-prompt">
            <h3>{getPlayerName(promptPlayer)}&apos;s Decision</h3>
            <p>
              {isCurrentPlayerTurn
                ? 'It&apos;s your turn to decide about this overpopulation.'
                : `Waiting for ${getPlayerName(promptPlayer)} to decide.`}
            </p>
          </div>

          <div className="overpopulation-actions">
            <button
              className="declare-btn"
              onClick={onDeclareOverpopulation}
              disabled={!isCurrentPlayerTurn}
            >
              Declare Overpopulation
            </button>
            <button
              className="ignore-btn"
              onClick={onIgnoreOverpopulation}
              disabled={!isCurrentPlayerTurn}
            >
              Ignore & Continue
            </button>
          </div>

          <div className="overpopulation-rules">
            <h4>Overpopulation Rules:</h4>
            <ul>
              <li>
                Either player can declare overpopulation when 4+ pieces of the
                same color exist in a system
              </li>
              <li>
                All pieces of the overpopulating color are returned to the bank
              </li>
              <li>
                If no stars remain, all remaining ships are also returned to the
                bank
              </li>
              <li>
                Both players get the opportunity to declare before play
                continues
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const getColorDisplayColor = (color: GamePiece.Color): string => {
  const colorMap = {
    yellow: '#eab308',
    green: '#16a34a',
    blue: '#2563eb',
    red: '#dc2626',
  };
  return colorMap[color];
};

export default OverpopulationModal;
