import React, { useState } from 'react';
import { System, GameAction, ActionValidationResult } from '../../../src/types';
import DiamondStar from './DiamondStar';
import DirectionalShip from './DirectionalShip';
import ActionMenu from './ActionMenu';
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
}

const HomeSystem: React.FC<HomeSystemProps> = ({
  system,
  isCurrentPlayer,
  isOpponent,
  onAction: _onAction,
  getAvailableActions,
}) => {
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleShipClick = (shipId: string, event: React.MouseEvent) => {
    if (!isCurrentPlayer) {
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setActionMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setSelectedShipId(shipId);
  };

  const handleCloseActionMenu = () => {
    setSelectedShipId(null);
    setActionMenuPosition(null);
  };

  return (
    <div
      className={`home-system ${isCurrentPlayer ? 'current-player' : ''} ${isOpponent ? 'opponent' : ''}`}
    >
      <div className="system-header">
        <h4>
          {isCurrentPlayer ? 'Your Home System' : "Opponent's Home System"}
        </h4>
        <div className="player-indicator">
          {isCurrentPlayer ? 'Player 1 (You)' : 'Player 2 (Opponent)'}
        </div>
      </div>

      <div className="system-content">
        {/* Stars */}
        <div className="stars-container">
          {system.stars.map((star, index) => (
            <div key={star.id} className="star-wrapper">
              <DiamondStar
                color={star.color}
                size={star.size}
                displaySize="large"
                isBinary={system.stars.length === 2 && index === 1}
              />
            </div>
          ))}
        </div>

        {/* Ships */}
        <div className="ships-container">
          {system.ships.map(ship => (
            <div key={ship.id} className="ship-wrapper">
              <DirectionalShip
                color={ship.color}
                size={ship.size}
                displaySize="medium"
                onClick={event => handleShipClick(ship.id, event)}
                isSelected={selectedShipId === ship.id}
                isClickable={isCurrentPlayer}
                isCurrentPlayer={isCurrentPlayer}
              />
              {isCurrentPlayer && (
                <div className="clickable-hint">Click to act</div>
              )}
              <div className="ship-owner">
                {ship.owner === 'player1' ? 'P1' : 'P2'}
              </div>
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
          onAction={actionType => {
            console.log('Action selected:', actionType);
            // TODO: Create actual action based on type and apply it
            handleCloseActionMenu();
          }}
        />
      )}
    </div>
  );
};

export default HomeSystem;
