import React, { useState, useCallback } from 'react';
import { System, GameAction, Piece } from '../../../src/types';
import { ActionValidationResult } from '../../../src/action-validator';
import TrianglePiece from './TrianglePiece';
import ActionMenu from './ActionMenu';
import './HomeSystem.css'; // Reuse the same styles for now

interface ActionOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  color?: string;
}

interface StarSystemProps {
  system: System;
  onAction: (action: GameAction) => ActionValidationResult;
  getAvailableActions: (shipId: string, systemId: string) => ActionOption[];
  bankPieces: Piece[];
  currentPlayer: 'player1' | 'player2';
  onTradeInitiate?: (
    shipId: string,
    systemId: string,
    validPieceIds: string[]
  ) => void;
  onMoveInitiate?: (shipId: string, fromSystemId: string) => void;
  onSystemClick?: (systemId: string) => void;
  isMoveDestination?: boolean;
  title?: string; // Optional custom title
}

const StarSystem: React.FC<StarSystemProps> = ({
  system,
  onAction: _onAction,
  getAvailableActions,
  bankPieces,
  currentPlayer,
  onTradeInitiate,
  onMoveInitiate,
  onSystemClick,
  isMoveDestination = false,
  title = 'Star System',
}) => {
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleShipClick = useCallback(
    (shipId: string, event: React.MouseEvent) => {
      const ship = system.ships.find(s => s.id === shipId);
      if (!ship || ship.owner !== currentPlayer) return;

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setSelectedShipId(shipId);
      setActionMenuPosition({
        x: rect.right + 10,
        y: rect.top,
      });
    },
    [system.ships, currentPlayer]
  );

  const handleActionSelect = useCallback(
    (actionId: string) => {
      if (!selectedShipId) return;

      if (actionId === 'trade' && onTradeInitiate) {
        // Get valid pieces for trade
        const ship = system.ships.find(s => s.id === selectedShipId);
        if (ship) {
          const validPieceIds = bankPieces
            .filter(
              piece => piece.size === ship.size && piece.color !== ship.color
            )
            .map(piece => piece.id);
          onTradeInitiate(selectedShipId, system.id, validPieceIds);
        }
      } else if (actionId === 'move' && onMoveInitiate) {
        onMoveInitiate(selectedShipId, system.id);
      } else {
        // Handle other actions through the action system
        const availableActions = getAvailableActions(selectedShipId, system.id);
        const action = availableActions.find(a => a.id === actionId);
        if (action && action.enabled) {
          // This would need to be implemented based on the specific action type
          console.log(
            'Action selected:',
            actionId,
            'for ship:',
            selectedShipId
          );
        }
      }

      setSelectedShipId(null);
      setActionMenuPosition(null);
    },
    [
      selectedShipId,
      system.ships,
      system.id,
      bankPieces,
      onTradeInitiate,
      onMoveInitiate,
      getAvailableActions,
    ]
  );

  const handleCloseMenu = useCallback(() => {
    setSelectedShipId(null);
    setActionMenuPosition(null);
  }, []);

  const handleSystemClick = () => {
    if (onSystemClick && isMoveDestination) {
      onSystemClick(system.id);
    }
  };

  // Helper function to determine player indicator
  const getPlayerIndicator = () => {
    const hasPlayer1Ships = system.ships.some(ship => ship.owner === 'player1');
    const hasPlayer2Ships = system.ships.some(ship => ship.owner === 'player2');

    if (hasPlayer1Ships && hasPlayer2Ships) {
      return 'Both Players';
    } else if (hasPlayer1Ships) {
      return 'Player 1';
    } else if (hasPlayer2Ships) {
      return 'Player 2';
    } else {
      return 'No Ships';
    }
  };

  return (
    <div
      className={`home-system ${isMoveDestination ? 'move-destination' : ''}`}
      onClick={isMoveDestination ? handleSystemClick : undefined}
    >
      <div className="system-header">
        <h4>{title}</h4>
        <div className="player-indicator">{getPlayerIndicator()}</div>
      </div>

      <div className="system-content">
        <div className="stars-section">
          <div className="section-label">Stars:</div>
          <div className="pieces-container">
            {system.stars.map(star => (
              <TrianglePiece
                key={star.id}
                piece={star}
                onClick={() => {}}
                disabled={true}
                showAsShip={false}
              />
            ))}
          </div>
        </div>

        <div className="ships-section">
          <div className="section-label">Ships:</div>
          <div className="pieces-container">
            {system.ships.length === 0 ? (
              <div className="no-pieces">No ships</div>
            ) : (
              system.ships.map(ship => (
                <TrianglePiece
                  key={ship.id}
                  piece={ship}
                  onClick={handleShipClick}
                  disabled={ship.owner !== currentPlayer}
                  showAsShip={true}
                  isSelected={selectedShipId === ship.id}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedShipId && actionMenuPosition && (
        <ActionMenu
          actions={getAvailableActions(selectedShipId, system.id)}
          position={actionMenuPosition}
          onActionSelect={handleActionSelect}
          onClose={handleCloseMenu}
        />
      )}
    </div>
  );
};

export default StarSystem;
