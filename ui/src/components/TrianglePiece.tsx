import React from 'react';
import { Color, Size } from '../../../src/types';
import './TrianglePiece.css';

interface TrianglePieceProps {
  color: Color;
  size: Size;
  displaySize?: 'small' | 'medium' | 'large';
  onClick?: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  isClickable?: boolean;
}

const TrianglePiece: React.FC<TrianglePieceProps> = ({
  color,
  size,
  displaySize = 'medium',
  onClick,
  isSelected = false,
  isClickable = false,
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
        return 20;
      case 'medium':
        return 28;
      case 'large':
        return 36;
      default:
        return 28;
    }
  };

  const baseSize = getDisplaySize(displaySize);
  const sizeMultiplier = getSizeMultiplier(size);
  const triangleSize = baseSize * sizeMultiplier;
  const triangleHeight = triangleSize * 0.866; // Height of equilateral triangle

  const handleClick = (event: React.MouseEvent) => {
    if (isClickable && onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className={`triangle-piece ${isClickable ? 'clickable' : ''} ${
        isSelected ? 'selected' : ''
      }`}
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
        {/* Size indicator */}
        <text
          x={triangleSize / 2}
          y={triangleHeight - 8}
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

export default TrianglePiece;
