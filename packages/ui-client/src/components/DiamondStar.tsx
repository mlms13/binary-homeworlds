import React from 'react';

import { GamePiece } from '@binary-homeworlds/engine';

import './DiamondStar.css';

import { getColorValue } from '../utils/colors.js';

interface DiamondStarProps {
  color: GamePiece.Color;
  size: GamePiece.Size;
  displaySize?: 'small' | 'medium' | 'large';
  onClick?: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  isClickable?: boolean;
  isBinary?: boolean; // For binary stars (nested diamonds)
}

const DiamondStar: React.FC<DiamondStarProps> = ({
  color,
  size,
  displaySize = 'medium',
  onClick,
  isSelected = false,
  isClickable = false,
  isBinary = false,
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
  const diamondSize = baseSize * sizeMultiplier;

  const handleClick = (event: React.MouseEvent) => {
    if (isClickable && onClick) {
      onClick(event);
    }
  };

  const createDiamondPath = (size: number, offset: number = 0) => {
    const half = size / 2;
    return `M${half + offset},${offset} L${size + offset},${half + offset} L${half + offset},${size + offset} L${offset},${half + offset} Z`;
  };

  return (
    <div
      className={`diamond-star ${isClickable ? 'clickable' : ''} ${
        isSelected ? 'selected' : ''
      }`}
      onClick={handleClick}
      style={{
        width: diamondSize,
        height: diamondSize,
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      <svg
        width={diamondSize}
        height={diamondSize}
        viewBox={`0 0 ${diamondSize} ${diamondSize}`}
        style={{
          filter: isSelected
            ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Main diamond */}
        <path
          d={createDiamondPath(diamondSize)}
          fill={getColorValue(color)}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1"
        />

        {/* Inner diamond for binary stars */}
        {isBinary && (
          <path
            d={createDiamondPath(diamondSize * 0.6, diamondSize * 0.2)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="2"
          />
        )}

        {/* Size indicator dots */}
        {Array.from({ length: size }, (_, i) => (
          <circle
            key={i}
            cx={diamondSize / 2 + (i - (size - 1) / 2) * 6}
            cy={diamondSize * 0.75}
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

export default DiamondStar;
