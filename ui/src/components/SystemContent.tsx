import React from 'react';
import { System } from '../../../src/types';
import DiamondStar from './DiamondStar';
import DirectionalShip from './DirectionalShip';

interface SystemContentProps {
  system: System;
  currentPlayer: 'player1' | 'player2';
  selectedShipId?: string | null;
  onShipClick?: (shipId: string, event: React.MouseEvent) => void;
}

const SystemContent: React.FC<SystemContentProps> = ({
  system,
  currentPlayer,
  selectedShipId,
  onShipClick,
}) => {
  const handleShipClick = (shipId: string, event: React.MouseEvent) => {
    if (onShipClick) {
      onShipClick(shipId, event);
    }
  };

  return (
    <div className="system-content">
      {/* All system objects in single line: opponent ships (small→big), stars, player ships (big→small) */}
      <div className="system-objects-container">
        {/* Opponent ships (small to big) */}
        {system.ships
          .filter(ship => ship.owner !== currentPlayer)
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
                isClickable={ship.owner === currentPlayer}
                isCurrentPlayer={ship.owner === currentPlayer}
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
          .filter(ship => ship.owner === currentPlayer)
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
                isClickable={ship.owner === currentPlayer}
                isCurrentPlayer={ship.owner === currentPlayer}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default SystemContent;
