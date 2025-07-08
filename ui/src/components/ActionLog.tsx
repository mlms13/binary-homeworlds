import React from 'react';
import { GameAction } from '../../../src/types';
import { BinaryHomeworldsGameState } from '../../../src/game-state';
import './ActionLog.css';

interface ActionLogProps {
  isOpen: boolean;
  onClose: () => void;
  actions: GameAction[];
  gameState: BinaryHomeworldsGameState;
}

const ActionLog: React.FC<ActionLogProps> = ({
  isOpen,
  onClose,
  actions,
  gameState,
}) => {
  const formatPlayerName = (player: string): string => {
    return player === 'player1' ? 'You' : 'Your opponent';
  };

  const getSizeText = (size: number): string => {
    switch (size) {
      case 1:
        return 'small';
      case 2:
        return 'medium';
      case 3:
        return 'large';
      default:
        return 'unknown';
    }
  };

  const getColorText = (color: string): string => {
    return color;
  };

  const getActionIcon = (actionType: string): React.ReactNode => {
    const iconStyle = { width: '16px', height: '16px', marginRight: '8px' };

    switch (actionType) {
      case 'setup':
        return (
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="8"
              stroke="#8b5cf6"
              strokeWidth="2"
              fill="#8b5cf6"
              fillOpacity="0.2"
            />
            <path
              d="M12 8v8M8 12h8"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'move':
        return (
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="#eab308"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'capture':
        return (
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="8" stroke="#dc2626" strokeWidth="2" />
          </svg>
        );
      case 'grow':
        return (
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="3" fill="#16a34a" />
            <circle
              cx="12"
              cy="12"
              r="6"
              stroke="#16a34a"
              strokeWidth="2"
              strokeDasharray="2 2"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="#16a34a"
              strokeWidth="1"
              strokeDasharray="1 3"
            />
          </svg>
        );
      case 'trade':
        return (
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 16l-4-4 4-4M17 8l4 4-4 4"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 12h18"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'sacrifice':
        return (
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="#7c3aed"
              strokeWidth="2"
              fill="#7c3aed"
              fillOpacity="0.3"
            />
          </svg>
        );
      case 'overpopulation':
        return (
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
            <path
              d="M12 6v6l4 2"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 8l8 8M16 8l-8 8"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        );
      default:
        return (
          <svg
            style={iconStyle}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="2" />
            <path
              d="M12 16v-4M12 8h.01"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  };

  const formatAction = (action: GameAction): React.ReactNode => {
    const playerName = formatPlayerName(action.player);

    // Helper function to get piece info from current game state
    // Look in both bank and systems since pieces move around
    const getPieceInfo = (pieceId: string) => {
      // First check current bank
      const bankPieces = gameState.getBankPieces();
      let piece = bankPieces.find(p => p.id === pieceId);
      if (piece) {
        return `${getSizeText(piece.size)} ${getColorText(piece.color)}`;
      }

      // If not in bank, check all systems
      const systems = gameState.getSystems();
      for (const system of systems) {
        // Check stars
        piece = system.stars.find(p => p.id === pieceId);
        if (piece) {
          return `${getSizeText(piece.size)} ${getColorText(piece.color)}`;
        }

        // Check ships
        piece = system.ships.find(p => p.id === pieceId);
        if (piece) {
          return `${getSizeText(piece.size)} ${getColorText(piece.color)}`;
        }
      }

      return 'unknown';
    };

    // Helper function to get ship info from systems
    const getShipInfo = (shipId: string) => {
      const systems = gameState.getSystems();
      for (const system of systems) {
        const ship = system.ships.find(s => s.id === shipId);
        if (ship) {
          return `${getSizeText(ship.size)} ${getColorText(ship.color)}`;
        }
      }
      return 'unknown';
    };

    // Helper function to get system description
    const getSystemDescription = (systemId: string) => {
      const system = gameState.getSystem(systemId);
      if (!system) return 'unknown system';

      const homePlayer1 = gameState.getHomeSystem('player1');
      const homePlayer2 = gameState.getHomeSystem('player2');

      if (homePlayer1 && system.id === homePlayer1.id) {
        return action.player === 'player1'
          ? 'your home system'
          : "opponent's home system";
      }
      if (homePlayer2 && system.id === homePlayer2.id) {
        return action.player === 'player2'
          ? 'your home system'
          : "opponent's home system";
      }

      // For non-home systems, describe by the largest star
      if (system.stars.length > 0) {
        const largestStar = system.stars.reduce((largest, star) =>
          star.size > largest.size ? star : largest
        );
        return `${getSizeText(largestStar.size)} ${getColorText(largestStar.color)} star system`;
      }

      return 'system';
    };

    const actionText = (() => {
      switch (action.type) {
        case 'setup':
          const setupPieceInfo = getPieceInfo(action.pieceId);
          if (action.role === 'star1' || action.role === 'star2') {
            return `selected a ${setupPieceInfo} star`;
          } else {
            return `selected a ${setupPieceInfo} ship`;
          }

        case 'move':
          const shipInfo = getShipInfo(action.shipId);
          const fromSystem = getSystemDescription(action.fromSystemId);
          if (action.toSystemId) {
            const toSystem = getSystemDescription(action.toSystemId);
            return `moved ${shipInfo} ship from ${fromSystem} to ${toSystem}`;
          } else {
            const newStarInfo = action.newStarPieceId
              ? getPieceInfo(action.newStarPieceId)
              : 'unknown';
            return `moved ${shipInfo} ship from ${fromSystem} to a new ${newStarInfo} star system`;
          }

        case 'capture':
          const attackingShipInfo = getShipInfo(action.attackingShipId);
          const targetShipInfo = getShipInfo(action.targetShipId);
          const captureSystem = getSystemDescription(action.systemId);
          return `captured ${targetShipInfo} ship with ${attackingShipInfo} ship at ${captureSystem}`;

        case 'grow':
          const newShipInfo = getPieceInfo(action.newShipPieceId);
          const growSystem = getSystemDescription(action.systemId);
          return `grew a ${newShipInfo} ship at ${growSystem}`;

        case 'trade':
          const tradedShipInfo = getShipInfo(action.shipId);
          const newPieceInfo = getPieceInfo(action.newPieceId);
          const tradeSystem = getSystemDescription(action.systemId);
          return `traded ${tradedShipInfo} ship for ${newPieceInfo} at ${tradeSystem}`;

        case 'sacrifice':
          const sacrificedShipInfo = getShipInfo(action.sacrificedShipId);
          const sacrificeSystem = getSystemDescription(action.systemId);
          const actionCount = action.followupActions.length;
          return `sacrificed ${sacrificedShipInfo} ship at ${sacrificeSystem} for ${actionCount} actions`;

        case 'overpopulation':
          const overpopSystem = getSystemDescription(action.systemId);
          return `declared ${getColorText(action.color)} overpopulation at ${overpopSystem}`;

        default:
          return 'performed an action';
      }
    })();

    return (
      <div className="action-content">
        {getActionIcon(action.type)}
        <span>
          <strong>{playerName}</strong> {actionText}
        </span>
      </div>
    );
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`action-log ${isOpen ? 'open' : 'closed'}`}>
      <div className="action-log-header">
        <h3>Action Log</h3>
        <button className="close-btn" onClick={onClose}>
          →
        </button>
      </div>

      <div className="action-log-content">
        {actions.length === 0 ? (
          <div className="no-actions">No actions yet. Start playing!</div>
        ) : (
          <div className="actions-list">
            {actions.map((action, index) => (
              <div key={index} className="action-item">
                <div className="action-text">{formatAction(action)}</div>
                <div className="action-timestamp">
                  {formatTimestamp(action.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionLog;
