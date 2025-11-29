import { Player } from './Player';

export type Color = 'yellow' | 'green' | 'blue' | 'red';
export type Size = 1 | 2 | 3; // small, medium, large

export type PieceId = `${Color}-${Size}-${0 | 1 | 2}`;

// Game piece representation
export interface Piece {
  color: Color;
  size: Size;
  id: PieceId; // unique identifier for tracking
}

// Ship extends piece with ownership
export interface Ship extends Piece {
  owner: Player;
}

// Star is just a piece (no owner)
export type Star = Piece;

export function shipToPiece(ship: Ship): Piece {
  return {
    color: ship.color,
    size: ship.size,
    id: ship.id,
  };
}
