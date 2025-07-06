import React from 'react';
import { Color, Size } from '../../../src/types';
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
  const getColorValue = (color: Color): string => {
    switch (color) {
      case 'red':
        return '#dc2626';
      case 'yellow':
        return '#eab308';
      case 'green':
        return '#16a34a';
      case 'blue':
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

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
        return 24;
      case 'medium':
        return 32;
      case 'large':
        return 40;
      default:
        return 32;
    }
  };

  const baseSize = getDisplaySize(displaySize);
  const sizeMultiplier = getSizeMultiplier(size);
  const shipSize = baseSize * sizeMultiplier;
  const shipHeight = shipSize * 0.866; // Height of equilateral triangle

  // Determine direction: if not specified, use isCurrentPlayer
  const pointDirection = direction || (isCurrentPlayer ? 'up' : 'down');

  const handleClick = (event: React.MouseEvent) => {
    if (isClickable && onClick) {
      onClick(event);
    }
  };

  const createTrianglePoints = (
    size: number,
    height: number,
    direction: string
  ) => {
    if (direction === 'up') {
      // Triangle pointing up (toward opponent)
      return `${size / 2},2 ${size - 2},${height - 2} 2,${height - 2}`;
    } else {
      // Triangle pointing down (toward current player)
      return `2,2 ${size - 2},2 ${size / 2},${height - 2}`;
    }
  };

  return (
    <div
      className={`directional-ship ${isClickable ? 'clickable' : ''} ${
        isSelected ? 'selected' : ''
      } direction-${pointDirection}`}
      onClick={handleClick}
      style={{
        width: shipSize,
        height: shipHeight,
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      <svg
        width={shipSize}
        height={shipHeight}
        viewBox={`0 0 ${shipSize} ${shipHeight}`}
        style={{
          filter: isSelected
            ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          transition: 'all 0.2s ease',
        }}
      >
        <polygon
          points={createTrianglePoints(shipSize, shipHeight, pointDirection)}
          fill={getColorValue(color)}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
        {/* Size indicator */}
        <text
          x={shipSize / 2}
          y={pointDirection === 'up' ? shipHeight - 8 : 16}
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)' }}
        >
          {size}
        </text>
      </svg>
    </div>
  );
};

export default DirectionalShip;
