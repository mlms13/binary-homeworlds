import React from 'react';
import { Piece as PieceType } from '../../../src/types';
import './Piece.css';

interface PieceProps {
  piece: PieceType;
  size?: 'small' | 'medium' | 'large';
  onClick?: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  isClickable?: boolean;
}

const Piece: React.FC<PieceProps> = ({
  piece,
  size = 'medium',
  onClick,
  isSelected = false,
  isClickable = false,
}) => {
  const sizeClass = `piece-size-${size}`;
  const colorClass = `piece-color-${piece.color}`;
  const shapeClass =
    piece.size === 1
      ? 'piece-small'
      : piece.size === 2
        ? 'piece-medium'
        : 'piece-large';

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
