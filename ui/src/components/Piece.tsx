import React from 'react';
import { Piece as PieceType } from '../../../src/types';
import './Piece.css';

interface PieceProps {
  piece: PieceType;
  size?: 'small' | 'medium' | 'large';
  onClick?: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  isClickable?: boolean;
  isTriangle?: boolean;
}

const Piece: React.FC<PieceProps> = ({
  piece,
  size = 'medium',
  onClick,
  isSelected = false,
  isClickable = false,
  isTriangle = false,
}) => {
  const sizeClass = `piece-size-${size}`;
  const colorClass = `piece-color-${piece.color}`;
  const shapeClass =
    piece.size === 1
      ? 'piece-small'
      : piece.size === 2
        ? 'piece-medium'
        : 'piece-large';
  const geometryClass = isTriangle ? 'piece-triangle' : 'piece-circle';

  const handleClick = (event: React.MouseEvent) => {
    if (isClickable && onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className={`
        piece
        ${sizeClass}
        ${colorClass}
        ${shapeClass}
        ${geometryClass}
        ${isSelected ? 'piece-selected' : ''}
        ${isClickable ? 'piece-clickable' : ''}
      `}
      onClick={handleClick}
      title={`${piece.color} ${piece.size === 1 ? 'small' : piece.size === 2 ? 'medium' : 'large'}`}
    >
      <div className="piece-inner">
        <div className="piece-size-indicator">{piece.size}</div>
      </div>
    </div>
  );
};

export default Piece;
