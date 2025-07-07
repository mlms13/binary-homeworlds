import React from 'react';
import { System, Color } from '../../../src/types';
import DiamondStar from './DiamondStar';
import DirectionalShip from './DirectionalShip';

interface SystemContentProps {
  system: System;
  currentPlayer: 'player1' | 'player2';
  selectedShipId?: string | null;
  onShipClick?: (shipId: string, event: React.MouseEvent) => void;
  pendingCapture?: {
    attackingShipId: string;
    systemId: string;
    validTargetShipIds: string[];
  } | null;
  onShipClickForCapture?: (targetShipId: string, systemId: string) => void;
  pendingSacrifice?: {
    shipColor: Color;
    actionsRemaining: number;
    actionType: 'move' | 'capture' | 'grow' | 'trade';
  } | null;
  onShipClickForSacrifice?: (shipId: string, systemId: string) => void;
}

const SystemContent: React.FC<SystemContentProps> = ({
  system,
  currentPlayer,
  selectedShipId,
  onShipClick,
  pendingCapture,
  onShipClickForCapture,
  pendingSacrifice,
  onShipClickForSacrifice,
}) => {
  const handleShipClick = (shipId: string, event: React.MouseEvent) => {
    // If we're in sacrifice mode, handle sacrifice action
    if (pendingSacrifice && onShipClickForSacrifice) {
      const ship = system.ships.find(s => s.id === shipId);
      // Only allow clicking ships owned by current player
      if (ship && ship.owner === currentPlayer) {
        onShipClickForSacrifice(shipId, system.id);
        return;
      }
    }

    // If we're in capture mode and this is a valid target, handle capture
    if (
      pendingCapture &&
      pendingCapture.systemId === system.id &&
      pendingCapture.validTargetShipIds.includes(shipId) &&
      onShipClickForCapture
    ) {
      onShipClickForCapture(shipId, system.id);
      return;
    }

    // Otherwise, handle normal ship click
    if (onShipClick) {
      onShipClick(shipId, event);
    }
  };

  return (
    <div className="system-content">
      {/* All system objects in single line: player2 ships (small→big), stars, player1 ships (big→small) */}
      <div className="system-objects-container">
        {/* Player 2 ships (small to big) */}
        {system.ships
          .filter(ship => ship.owner === 'player2')
          .slice()
          .sort((a, b) => a.size - b.size)
          .map(ship => {
            const isCaptureTarget =
              pendingCapture &&
              pendingCapture.systemId === system.id &&
              pendingCapture.validTargetShipIds.includes(ship.id);

            return (
              <div
                key={ship.id}
                className={`ship-wrapper ${isCaptureTarget ? 'capture-target' : ''}`}
              >
                <DirectionalShip
                  color={ship.color}
                  size={ship.size}
                  displaySize="medium"
                  onClick={event => handleShipClick(ship.id, event)}
                  isSelected={selectedShipId === ship.id}
                  isClickable={
                    ship.owner === currentPlayer || !!isCaptureTarget
                  }
                  isCurrentPlayer={ship.owner === 'player1'}
                />
              </div>
            );
          })}

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

        {/* Player 1 ships (big to small) */}
        {system.ships
          .filter(ship => ship.owner === 'player1')
          .slice()
          .sort((a, b) => b.size - a.size)
          .map(ship => {
            const isCaptureTarget =
              pendingCapture &&
              pendingCapture.systemId === system.id &&
              pendingCapture.validTargetShipIds.includes(ship.id);

            return (
              <div
                key={ship.id}
                className={`ship-wrapper ${isCaptureTarget ? 'capture-target' : ''}`}
              >
                <DirectionalShip
                  color={ship.color}
                  size={ship.size}
                  displaySize="medium"
                  onClick={event => handleShipClick(ship.id, event)}
                  isSelected={selectedShipId === ship.id}
                  isClickable={
                    ship.owner === currentPlayer || !!isCaptureTarget
                  }
                  isCurrentPlayer={ship.owner === 'player1'}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default SystemContent;
