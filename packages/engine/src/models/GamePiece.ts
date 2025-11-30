import { getOtherPlayer, Player } from './Player';

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

/**
 * Set the owner of a ship
 * @param ship - The ship to set the owner of
 * @param owner - The new owner of the ship
 * @returns A copy of the ship with the new owner
 */
export function setShipOwner(ship: Ship, owner: Player): Ship {
  return { ...ship, owner };
}

/**
 * Switch the owner of a ship from its current owner to the other player
 * @param ship - The target ship
 * @returns A copy of the ship with its new owner
 */
export function switchShipOwner(ship: Ship): Ship {
  return setShipOwner(ship, getOtherPlayer(ship.owner));
}
