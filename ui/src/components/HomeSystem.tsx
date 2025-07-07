import React, { useState, useMemo, useCallback } from 'react';
import {
  System,
  GameAction,
  ActionValidationResult,
  Piece,
} from '../../../src/types';
import {
  createGrowAction,
  createTradeAction,
} from '../../../src/action-builders';
import DiamondStar from './DiamondStar';
import DirectionalShip from './DirectionalShip';
import ActionMenu from './ActionMenu';
import BankPieceSelector from './BankPieceSelector';
import './HomeSystem.css';

interface ActionOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  color?: string;
}

interface HomeSystemProps {
  system: System;
  isCurrentPlayer: boolean;
  isOpponent: boolean;
  onAction: (action: GameAction) => ActionValidationResult;
  getAvailableActions: (shipId: string, systemId: string) => ActionOption[];
  bankPieces: Piece[];
  currentPlayer: 'player1' | 'player2';
}

const HomeSystem: React.FC<HomeSystemProps> = ({
  system,
  isCurrentPlayer,
  isOpponent,
  onAction,
  getAvailableActions,
  bankPieces,
  currentPlayer,
}) => {
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [pendingActionType, setPendingActionType] = useState<
    'grow' | 'trade' | null
  >(null);

  const handleShipClick = (shipId: string, event: React.MouseEvent) => {
    console.log('HANDLING SHIP CLICK');
    if (!isCurrentPlayer) {
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 250; // Approximate menu height

    // Calculate position, ensuring menu stays on screen
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 10; // Position below the ship by default

    // Adjust horizontal position if menu would go off-screen
    if (x + menuWidth / 2 > window.innerWidth) {
      x = window.innerWidth - menuWidth / 2 - 10;
    }
    if (x - menuWidth / 2 < 0) {
      x = menuWidth / 2 + 10;
    }

    // Adjust vertical position if menu would go off-screen
    if (y + menuHeight > window.innerHeight) {
      y = rect.top - menuHeight - 10; // Position above the ship instead
    }

    setActionMenuPosition({ x, y });
    setSelectedShipId(shipId);
  };

  const handleCloseActionMenu = useCallback((preserveShipId = false) => {
    // Don't clear selectedShipId if we're preserving it for trade action
    if (!preserveShipId) {
      setSelectedShipId(null);
    }
    setActionMenuPosition(null);
  }, []);

  const handleGrowAction = useCallback(() => {
    if (!selectedShipId) return;

    const actingShip = system.ships.find(s => s.id === selectedShipId);
    if (!actingShip) return;

    // Find the smallest available piece of the same color
    const availablePieces = bankPieces
      .filter(piece => piece.color === actingShip.color)
      .sort((a, b) => a.size - b.size); // Sort by size ascending

    const smallestPiece = availablePieces[0];
    if (!smallestPiece) return; // No pieces available

    const action = createGrowAction(
      currentPlayer,
      selectedShipId,
      system.id,
      smallestPiece.id
    );

    // Apply the action
    onAction(action);

    // Reset state
    setSelectedShipId(null);
  }, [
    selectedShipId,
    system.ships,
    system.id,
    bankPieces,
    currentPlayer,
    onAction,
  ]);

  const handleActionSelect = useCallback(
    (actionType: string) => {
      if (actionType === 'grow') {
        // Grow action: automatically select smallest available piece of same color
        handleGrowAction();
        handleCloseActionMenu();
      } else if (actionType === 'trade') {
        setPendingActionType(actionType);
        setShowBankSelector(true);
        // Close action menu but keep selectedShipId for bank selector
        handleCloseActionMenu(true); // Pass true to preserve selectedShipId
      } else {
        // Handle other action types (move, capture, etc.)
        handleCloseActionMenu();
      }
    },
    [selectedShipId, handleCloseActionMenu, handleGrowAction]
  );

  const handleBankPieceSelect = useCallback(
    (piece: Piece) => {
      if (!selectedShipId || pendingActionType !== 'trade') return;

      const action = createTradeAction(
        currentPlayer,
        selectedShipId,
        system.id,
        piece.id
      );

      // Apply the action
      onAction(action);

      // Reset state
      setShowBankSelector(false);
      setPendingActionType(null);
      setSelectedShipId(null);
    },
    [selectedShipId, pendingActionType, currentPlayer, system.id, onAction]
  );

  const handleCloseBankSelector = useCallback(() => {
    setShowBankSelector(false);
    setPendingActionType(null);
    setSelectedShipId(null);
  }, []);

  // Memoize valid bank piece IDs to preserve them even if selectedShipId changes
  const validBankPieceIds = useMemo(() => {
    if (!pendingActionType || !selectedShipId) return [];

    const actingShip = system.ships.find(s => s.id === selectedShipId);
    if (!actingShip) return [];

    if (pendingActionType === 'trade') {
      // Can trade for pieces of different colors and same size
      return bankPieces
        .filter(
          piece =>
            piece.color !== actingShip.color && piece.size === actingShip.size
        )
        .map(piece => piece.id);
    }

    return [];
  }, [pendingActionType, selectedShipId, system.ships, bankPieces]);

  return (
    <div
      className={`home-system ${isCurrentPlayer ? 'current-player' : ''} ${isOpponent ? 'opponent' : ''}`}
    >
      <div className="system-header">
        <h4>{isOpponent ? "Opponent's Home System" : 'Your Home System'}</h4>
        <div className="player-indicator">
          {isOpponent ? 'Player 2 (Opponent)' : 'Player 1 (You)'}
        </div>
      </div>

      <div className="system-content">
        {/* All system objects in single line: opponent ships (small→big), stars, player ships (big→small) */}
        <div className="system-objects-container">
          {/* Opponent ships (small to big) */}
          {system.ships
            .filter(ship => ship.owner === 'player2')
            .slice()
            .sort((a, b) => a.size - b.size)
            .map(ship => (
              <div key={ship.id} className="ship-wrapper">
                <DirectionalShip
                  color={ship.color}
                  size={ship.size}
                  displaySize="medium"
                  onClick={event => handleShipClick(ship.id, event)}
                  isSelected={selectedShipId === ship.id}
                  isClickable={isCurrentPlayer}
                  isCurrentPlayer={ship.owner === 'player1'}
                />
              </div>
            ))}

          {/* Stars (larger first) */}
          {system.stars
            .slice()
            .sort((a, b) => b.size - a.size)
            .map((star, index) => (
              <div key={star.id} className="star-wrapper">
                <DiamondStar
                  color={star.color}
                  size={star.size}
                  displaySize="large"
                  isBinary={system.stars.length === 2 && index === 1}
                />
              </div>
            ))}

          {/* Player ships (big to small) */}
          {system.ships
            .filter(ship => ship.owner === 'player1')
            .slice()
            .sort((a, b) => b.size - a.size)
            .map(ship => (
              <div key={ship.id} className="ship-wrapper">
                <DirectionalShip
                  color={ship.color}
                  size={ship.size}
                  displaySize="medium"
                  onClick={event => handleShipClick(ship.id, event)}
                  isSelected={selectedShipId === ship.id}
                  isClickable={isCurrentPlayer}
                  isCurrentPlayer={ship.owner === 'player1'}
                />
              </div>
            ))}
        </div>
      </div>

      {/* Action Menu */}
      {selectedShipId && actionMenuPosition && (
        <ActionMenu
          shipId={selectedShipId}
          systemId={system.id}
          position={actionMenuPosition}
          availableActions={getAvailableActions(selectedShipId, system.id)}
          onClose={handleCloseActionMenu}
          onAction={handleActionSelect}
        />
      )}

      {/* Bank Piece Selector */}
      <BankPieceSelector
        isOpen={showBankSelector}
        title="Select piece to trade for"
        bankPieces={bankPieces}
        validPieceIds={validBankPieceIds}
        onPieceSelect={handleBankPieceSelect}
        onClose={handleCloseBankSelector}
      />
    </div>
  );
};

export default HomeSystem;
