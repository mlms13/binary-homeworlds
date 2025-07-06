import React from 'react';
import { Color, Size } from '../../../src/types';
import { getColorValue } from '../utils/colors';
import './DirectionalShip.css';

interface DirectionalShipProps {
  color: Color;
  size: Size;
  displaySize?: 'small' | 'medium' | 'large';
  onClick?: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  isClickable?: boolean;
  direction?: 'up' | 'down'; // up = pointing toward opponent, down = pointing toward player
  isCurrentPlayer?: boolean; // Used to determine direction automatically
}

const DirectionalShip: React.FC<DirectionalShipProps> = ({
  color,
  size,
  displaySize = 'medium',
  onClick,
  isSelected = false,
  isClickable = false,
  direction,
  isCurrentPlayer = false,
}) => {
  const getSizeMultiplier = (size: Size): number => {
    switch (size) {
      case 1:
        return 0.8;
      case 2:
        return 1.0;
      case 3:
        return 1.2;
      default:
        return 1.0;
    }
  };

  const getDisplaySize = (displaySize: string): number => {
    switch (displaySize) {
      case 'small':
        return 32; // Increased for better visibility
      case 'medium':
        return 40; // Increased for better visibility
      case 'large':
        return 50; // Increased for better visibility
      default:
        return 40;
    }
  };

  const baseSize = getDisplaySize(displaySize);
  const sizeMultiplier = getSizeMultiplier(size);
  const shipWidth = baseSize * sizeMultiplier;
  const shipHeight = shipWidth * 1.3; // Make ships longer than wide (taller triangles)

  // Determine direction: if not specified, use isCurrentPlayer
  const pointDirection = direction || (isCurrentPlayer ? 'up' : 'down');

  const handleClick = (event: React.MouseEvent) => {
    if (isClickable && onClick) {
      onClick(event);
    }
  };

  const createTrianglePoints = (
    width: number,
    height: number,
    direction: string
  ) => {
    if (direction === 'up') {
      // Triangle pointing up (toward opponent)
      return `${width / 2},2 ${width - 2},${height - 2} 2,${height - 2}`;
    } else {
      // Triangle pointing down (toward current player)
      return `2,2 ${width - 2},2 ${width / 2},${height - 2}`;
    }
  };

  return (
    <div
      className={`directional-ship ${isClickable ? 'clickable' : ''} ${
        isSelected ? 'selected' : ''
      } direction-${pointDirection}`}
      onClick={handleClick}
      style={{
        width: shipWidth,
        height: shipHeight,
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      <svg
        width={shipWidth}
        height={shipHeight}
        viewBox={`0 0 ${shipWidth} ${shipHeight}`}
        style={{
          filter: isSelected
            ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          transition: 'all 0.2s ease',
        }}
      >
        <polygon
          points={createTrianglePoints(shipWidth, shipHeight, pointDirection)}
          fill={getColorValue(color)}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
        {/* Size indicator dots */}
        {Array.from({ length: size }, (_, i) => (
          <circle
            key={i}
            cx={shipWidth / 2 + (i - (size - 1) / 2) * 6}
            cy={pointDirection === 'up' ? shipHeight - 10 : 14}
            r="2"
            fill="rgba(255, 255, 255, 0.7)"
            stroke="rgba(0, 0, 0, 0.3)"
            strokeWidth="0.5"
          />
        ))}
      </svg>
    </div>
  );
};

export default DirectionalShip;
