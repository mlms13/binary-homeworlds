import React, { useState, useCallback } from 'react';
import {
  System,
  GameAction,
  Piece,
  ActionValidationResult,
  Color,
} from '@binary-homeworlds/shared';
import { createGrowAction } from '@binary-homeworlds/shared';
import SystemContent from './SystemContent';
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
  onCaptureInitiate?: (
    attackingShipId: string,
    systemId: string,
    validTargetShipIds: string[]
  ) => void;
  onShipClickForCapture?: (targetShipId: string, systemId: string) => void;
  pendingCapture?: {
    attackingShipId: string;
    systemId: string;
    validTargetShipIds: string[];
  } | null;
  onSacrificeInitiate?: (sacrificedShipId: string, systemId: string) => void;
  pendingSacrifice?: {
    shipColor: Color;
    actionsRemaining: number;
    actionType: 'move' | 'capture' | 'grow' | 'trade';
  } | null;
  onShipClickForSacrifice?: (shipId: string, systemId: string) => void;
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
  onCaptureInitiate,
  onShipClickForCapture,
  pendingCapture,
  onSacrificeInitiate,
  pendingSacrifice,
  onShipClickForSacrifice,
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

      // Calculate initial position with some smart defaults
      // Try to position to the right first, but consider viewport bounds
      const viewportWidth = window.innerWidth;
      const estimatedMenuWidth = 200;

      let x = rect.right + 10;
      let y = rect.top;

      // If menu would go off the right edge, position to the left
      if (x + estimatedMenuWidth > viewportWidth) {
        x = rect.left - estimatedMenuWidth - 10;
      }

      // If still off screen, center on the element
      if (x < 0) {
        x = rect.left + rect.width / 2;
      }

      setSelectedShipId(shipId);
      setActionMenuPosition({ x, y });
    },
    [system.ships, currentPlayer]
  );

  const handleGrowAction = useCallback(() => {
    if (!selectedShipId) return;

    const actingShip = system.ships.find(s => s.id === selectedShipId);
    if (!actingShip) return;

    // Find the smallest available piece of the same color
    const availablePieces = bankPieces
      .filter(piece => piece.color === actingShip.color)
      .sort((a, b) => a.size - b.size);

    const smallestPiece = availablePieces[0];
    if (!smallestPiece) return; // No pieces available

    const action = createGrowAction(
      currentPlayer,
      selectedShipId,
      system.id,
      smallestPiece.id
    );

    // Apply the action
    _onAction(action);

    // Reset state
    setSelectedShipId(null);
    setActionMenuPosition(null);
  }, [
    selectedShipId,
    system.ships,
    system.id,
    bankPieces,
    currentPlayer,
    _onAction,
  ]);

  const handleActionSelect = useCallback(
    (actionId: string) => {
      if (!selectedShipId) return;

      if (actionId === 'grow') {
        // Grow action: automatically select smallest available piece of same color
        handleGrowAction();
      } else if (actionId === 'trade' && onTradeInitiate) {
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
      } else if (actionId === 'capture' && onCaptureInitiate) {
        // Get valid target ships for capture
        const attackingShip = system.ships.find(s => s.id === selectedShipId);
        if (attackingShip) {
          const validTargetShipIds = system.ships
            .filter(
              ship =>
                ship.owner !== currentPlayer && // Enemy ship
                attackingShip.size >= ship.size // Size restriction
            )
            .map(ship => ship.id);
          onCaptureInitiate(selectedShipId, system.id, validTargetShipIds);
        }
      } else if (actionId === 'sacrifice' && onSacrificeInitiate) {
        onSacrificeInitiate(selectedShipId, system.id);
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
      onCaptureInitiate,
      onSacrificeInitiate,
      getAvailableActions,
      handleGrowAction,
      currentPlayer,
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

      <SystemContent
        system={system}
        currentPlayer={currentPlayer}
        selectedShipId={selectedShipId}
        onShipClick={handleShipClick}
        pendingCapture={pendingCapture}
        onShipClickForCapture={onShipClickForCapture}
        pendingSacrifice={pendingSacrifice}
        onShipClickForSacrifice={onShipClickForSacrifice}
      />

      {selectedShipId && actionMenuPosition && (
        <ActionMenu
          shipId={selectedShipId}
          systemId={system.id}
          position={actionMenuPosition}
          availableActions={getAvailableActions(selectedShipId, system.id)}
          onClose={handleCloseMenu}
          onAction={handleActionSelect}
        />
      )}
    </div>
  );
};

export default StarSystem;
