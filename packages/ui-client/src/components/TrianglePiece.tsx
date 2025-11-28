import React from 'react';

import { GamePiece } from '@binary-homeworlds/engine';

import './TrianglePiece.css';

import { getColorValue } from '../utils/colors.js';

interface TrianglePieceProps {
  color: GamePiece.Color;
  size: GamePiece.Size;
  displaySize?: 'small' | 'medium' | 'large';
  onClick?: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  isClickable?: boolean;
  isDisabled?: boolean;
}

const TrianglePiece: React.FC<TrianglePieceProps> = ({
  color,
  size,
  displaySize = 'medium',
  onClick,
  isSelected = false,
  isClickable = false,
  isDisabled = false,
}) => {
  const getSizeMultiplier = (size: GamePiece.Size): number => {
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
        return 40; // Further increased for better visibility
      case 'medium':
        return 50; // Further increased for better visibility
      case 'large':
        return 60; // Further increased for better visibility
      default:
        return 50;
    }
  };

  const baseSize = getDisplaySize(displaySize);
  const sizeMultiplier = getSizeMultiplier(size);
  const triangleSize = baseSize * sizeMultiplier;
  const triangleHeight = triangleSize * 0.866; // Height of equilateral triangle

  const handleClick = (event: React.MouseEvent) => {
    if (isClickable && !isDisabled && onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className={`triangle-piece ${isClickable && !isDisabled ? 'clickable' : ''} ${
        isSelected ? 'selected' : ''
      } ${isDisabled ? 'disabled' : ''}`}
      onClick={handleClick}
      style={{
        width: triangleSize,
        height: triangleHeight,
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      <svg
        width={triangleSize}
        height={triangleHeight}
        viewBox={`0 0 ${triangleSize} ${triangleHeight}`}
        className={`color-${color}`}
        style={{
          filter: isSelected
            ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          transition: 'all 0.2s ease',
        }}
      >
        <polygon
          points={`${triangleSize / 2},2 ${triangleSize - 2},${
            triangleHeight - 2
          } 2,${triangleHeight - 2}`}
          fill={getColorValue(color)}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
        {/* Size indicator dots */}
        {Array.from({ length: size }, (_, i) => (
          <circle
            key={i}
            cx={triangleSize / 2 + (i - (size - 1) / 2) * 6}
            cy={triangleHeight - 10}
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

export default TrianglePiece;
