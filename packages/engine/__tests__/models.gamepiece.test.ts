import { describe, expect, it } from 'vitest';

import { GamePiece } from '../src';

describe('GamePiece', () => {
  it('should set the owner of a ship', () => {
    const piece = { color: 'yellow', size: 1, id: 'yellow-1-0' } as const;
    const ship = { ...piece, owner: 'player1' } as const;

    expect(ship.owner).toBe('player1');
    const newShip = GamePiece.switchShipOwner(ship);
    expect(newShip.owner).toBe('player2');
  });
});
