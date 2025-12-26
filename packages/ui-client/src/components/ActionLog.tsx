import { GamePiece, Player, StarSystem } from '@binary-homeworlds/engine';
import {
  bankToPieces,
  findShip,
  GameAction,
  GameEngine,
} from '@binary-homeworlds/shared';

import './ActionLog.css';

interface ActionLogProps {
  actions: Array<GameAction>;
  onClose: () => void;
  getPlayerDisplayName: (player: Player.Player) => string;
}

export default function ActionLog({
  actions,
  onClose,
  getPlayerDisplayName,
}: ActionLogProps) {
  const getActionDescription = (action: GameAction, index: number): string => {
    const playerName = getPlayerDisplayName(action.player);

    // Create a temporary game engine to replay up to this action
    const tempEngine = new GameEngine();

    // Apply all actions up to (but not including) this one
    // Use a different variable name to avoid shadowing
    for (const prevAction of actions.slice(0, index)) {
      tempEngine.applyAction(prevAction);
    }

    const stateBefore = tempEngine.getGameState().getState();

    // Apply this action
    tempEngine.applyAction(action);
    const stateAfter = tempEngine.getGameState().getState();

    // Narrow the type BEFORE using it in the switch
    // TypeScript should properly narrow discriminated unions in switch statements
    const bankPiecesBefore = bankToPieces(stateBefore.bank);

    switch (action.type) {
      case 'setup': {
        const sizeName =
          action.size === 1 ? 'small' : action.size === 2 ? 'medium' : 'large';
        const roleText = action.role === 'ship' ? 'ship' : 'star';
        return `${playerName} selected a ${sizeName} ${action.color} ${roleText}`;
      }

      case 'move': {
        // TypeScript should narrow 'action' to MoveAction here
        // If it doesn't, there's likely a type resolution issue
        const ship = findShip(stateBefore, action.shipId)?.ship;
        if (!ship) return `${playerName} moved a ship`;

        const fromSystem = findSystemWithShip(stateBefore, action.shipId);
        const toSystem = action.toSystemId
          ? (stateAfter.systems.find(
              (s: StarSystem.StarSystem) => s.id === action.toSystemId
            ) ?? null)
          : null;

        const shipDesc = `${ship.size === 1 ? 'small' : ship.size === 2 ? 'medium' : 'large'} ${ship.color} ship`;

        if (action.toSystemId) {
          const fromName = getSystemName(fromSystem);
          const toName = getSystemName(
            toSystem && 'id' in toSystem ? toSystem : null
          );
          return `${playerName} moved ${shipDesc} from ${fromName} to ${toName}`;
        } else {
          const newStar = bankPiecesBefore.find(
            (p: { id: string; color: string; size: number }) =>
              p.id === action.newStarPieceId
          );
          const starDesc = newStar
            ? `${newStar.size === 1 ? 'small' : newStar.size === 2 ? 'medium' : 'large'} ${newStar.color}`
            : 'unknown';
          return `${playerName} moved ${shipDesc} to a new ${starDesc} system`;
        }
      }

      case 'capture': {
        const attackingShip = findShip(
          stateBefore,
          action.attackingShipId
        )?.ship;
        const targetShip = findShip(stateBefore, action.targetShipId)?.ship;

        if (!attackingShip || !targetShip)
          return `${playerName} captured a ship`;

        const attackerDesc = `${attackingShip.size === 1 ? 'small' : attackingShip.size === 2 ? 'medium' : 'large'} ${attackingShip.color}`;
        const targetDesc = `${targetShip.size === 1 ? 'small' : targetShip.size === 2 ? 'medium' : 'large'} ${targetShip.color}`;

        return `${playerName} captured ${targetDesc} ship with ${attackerDesc} ship`;
      }

      case 'grow': {
        const actingShip = findShip(stateBefore, action.actingShipId)?.ship;
        const newPiece = bankPiecesBefore.find(
          (p: { id: string; color: string; size: number }) =>
            p.id === action.newShipPieceId
        );

        if (!actingShip || !newPiece) return `${playerName} grew a ship`;

        const actingDesc = `${actingShip.color}`;
        const newDesc = `${newPiece.size === 1 ? 'small' : newPiece.size === 2 ? 'medium' : 'large'} ${newPiece.color}`;

        return `${playerName} used ${actingDesc} to grow a ${newDesc} ship`;
      }

      case 'trade': {
        const oldShip = findShip(stateBefore, action.shipId)?.ship;
        const newPiece = bankPiecesBefore.find(
          (p: { id: string; color: string; size: number }) =>
            p.id === action.newPieceId
        );

        if (!oldShip || !newPiece) return `${playerName} traded a ship`;

        const oldDesc = `${oldShip.size === 1 ? 'small' : oldShip.size === 2 ? 'medium' : 'large'} ${oldShip.color}`;
        const newDesc = `${newPiece.size === 1 ? 'small' : newPiece.size === 2 ? 'medium' : 'large'} ${newPiece.color}`;

        return `${playerName} traded ${oldDesc} ship for ${newDesc} ship`;
      }

      case 'sacrifice': {
        const sacrificedShip = findShip(
          stateBefore,
          action.sacrificedShipId
        )?.ship;
        if (!sacrificedShip) return `${playerName} sacrificed a ship`;

        const shipDesc = `${sacrificedShip.size === 1 ? 'small' : sacrificedShip.size === 2 ? 'medium' : 'large'} ${sacrificedShip.color}`;
        const actionCount = action.followupActions.length;
        const actionWord = actionCount === 1 ? 'action' : 'actions';

        return `${playerName} sacrificed ${shipDesc} ship for ${actionCount} ${actionWord}`;
      }

      case 'overpopulation': {
        const system =
          stateBefore.systems.find(s => s.id === action.systemId) ?? null;
        const systemName = getSystemName(system);

        return `${playerName} declared ${action.color} overpopulation at ${systemName}`;
      }

      default:
        return `${playerName} made an unknown action`;
    }
  };

  const findSystemWithShip = (
    state: { systems: Array<StarSystem.StarSystem> },
    shipId: GamePiece.PieceId
  ) => {
    return (
      state.systems.find(system =>
        system.ships.some(ship => ship.id === shipId)
      ) ?? null
    );
  };

  const getSystemName = (system: StarSystem.StarSystem | null) => {
    if (!system) return 'unknown system';

    if (system.id === 'player1-home') {
      return `${getPlayerDisplayName('player1')}'s home`;
    } else if (system.id === 'player2-home') {
      return `${getPlayerDisplayName('player2')}'s home`;
    } else {
      // Describe by stars
      const stars = (system.stars ?? [])
        .map((star: { size: number; color: string }) => {
          const size =
            star.size === 1 ? 'small' : star.size === 2 ? 'medium' : 'large';
          return `${size} ${star.color}`;
        })
        .join(' and ');
      return `${stars} system`;
    }
  };

  const getActionIcon = (action: GameAction): string => {
    switch (action.type) {
      case 'setup':
        return '🏗️';
      case 'move':
        return '🚀';
      case 'capture':
        return '⚔️';
      case 'grow':
        return '🌱';
      case 'trade':
        return '🔄';
      case 'sacrifice':
        return '💥';
      case 'overpopulation':
        return '💥';
      default:
        return '❓';
    }
  };

  const getActionColor = (action: GameAction): string => {
    switch (action.type) {
      case 'setup':
        return '#4CAF50';
      case 'move':
        return '#2196F3';
      case 'capture':
        return '#F44336';
      case 'grow':
        return '#8BC34A';
      case 'trade':
        return '#FF9800';
      case 'sacrifice':
        return '#9C27B0';
      case 'overpopulation':
        return '#E91E63';
      default:
        return '#757575';
    }
  };

  return (
    <div className="action-log-overlay">
      <div className="action-log">
        <div className="action-log-header">
          <h3>Action Log</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="action-log-content">
          {actions.length === 0 ? (
            <div className="no-actions">No actions yet</div>
          ) : (
            <div className="actions-list">
              {actions.map((action, index) => (
                <div key={index} className="action-item">
                  <div
                    className="action-icon"
                    style={{ color: getActionColor(action) }}
                  >
                    {getActionIcon(action)}
                  </div>
                  <div className="action-description">
                    {getActionDescription(action, index)}
                  </div>
                  <div className="action-turn">
                    Turn {Math.floor(index / 2) + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
