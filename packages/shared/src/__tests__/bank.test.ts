import { describe, expect, it } from 'vitest';

import { GamePiece } from '@binary-homeworlds/engine';

import { createGrowAction, createSetupAction } from '../action-builders';
import { GameEngine } from '../game-engine';
import { BinaryHomeworldsGameState } from '../game-state';

// Helper to pick the smallest available piece of a color
function pickSmallestAvailable(
  gameState: BinaryHomeworldsGameState,
  color: GamePiece.Color
) {
  const pieces = gameState
    .getBankPieces()
    .filter(p => p.color === color)
    .sort((a, b) => a.size - b.size);
  return pieces[0]?.id;
}

describe('Bank depletion edge cases', () => {
  it('should return a validation error when trying to grow a yellow ship with no yellow pieces left in the bank', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();
    // Setup: Both players set up homeworlds with green and yellow stars, and a yellow ship
    const p1Star1 = pickSmallestAvailable(gameState, 'green');
    engine.applyAction(createSetupAction('player1', p1Star1!, 'star1'));
    const p2Star1 = pickSmallestAvailable(gameState, 'green');
    engine.applyAction(createSetupAction('player2', p2Star1!, 'star1'));
    const p1Star2 = pickSmallestAvailable(gameState, 'yellow');
    engine.applyAction(createSetupAction('player1', p1Star2!, 'star2'));
    const p2Star2 = pickSmallestAvailable(gameState, 'yellow');
    engine.applyAction(createSetupAction('player2', p2Star2!, 'star2'));
    const p1Ship = pickSmallestAvailable(gameState, 'yellow');
    engine.applyAction(createSetupAction('player1', p1Ship!, 'ship'));
    const p2Ship = pickSmallestAvailable(gameState, 'yellow');
    engine.applyAction(createSetupAction('player2', p2Ship!, 'ship'));
    // Now both home systems are established, and 6 yellow pieces have been used (2 stars + 1 ship per player)
    type Player = 'player1' | 'player2';
    let currentPlayer: Player = 'player1';
    let lastShip: Record<Player, GamePiece.PieceId> = {
      player1: p1Ship!,
      player2: p2Ship!,
    };
    // Alternate grow actions until all yellow pieces are gone
    while (true) {
      const growId = pickSmallestAvailable(gameState, 'yellow');
      if (!growId) break;
      const growAction = createGrowAction(
        currentPlayer,
        lastShip[currentPlayer],
        gameState.getHomeSystem(currentPlayer)!.id,
        growId
      );
      const result = engine.applyAction(growAction);
      expect(result.valid).toBe(true);
      lastShip[currentPlayer] = growId;
      // Alternate player
      currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
    }
    // At this point, all 9 yellow pieces should be used
    const growIdFail = pickSmallestAvailable(gameState, 'yellow');
    expect(growIdFail).toBeUndefined(); // There should be no yellow left
    // Try to grow a 10th yellow ship (should fail)
    const failGrowAction = createGrowAction(
      currentPlayer,
      lastShip[currentPlayer],
      gameState.getHomeSystem(currentPlayer)!.id,
      'yellow-1-0' as GamePiece.PieceId // Using valid ID but piece won't be in bank
    );
    const failResult = engine.applyAction(failGrowAction);
    expect(failResult.valid).toBe(false);
    expect(failResult.error).toMatch(/not found in bank|not available/i);
  });
});

it('should validate piece counts in bank', () => {
  const engine = new GameEngine();
  const gameState = engine.getGameState();
  const bankPieces = gameState.getBankPieces();

  // Count pieces by color and size
  const counts: Record<string, number> = {};
  for (const piece of bankPieces) {
    const key = `${piece.color}-${piece.size}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  // Should have exactly 3 of each color-size combination
  const colors: Array<GamePiece.Color> = ['yellow', 'green', 'blue', 'red'];
  const sizes: Array<GamePiece.Size> = [1, 2, 3];

  for (const color of colors) {
    for (const size of sizes) {
      const key = `${color}-${size}`;
      expect(counts[key]).toBe(3);
    }
  }
});
