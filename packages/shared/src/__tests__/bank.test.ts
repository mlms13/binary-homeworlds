import { describe, expect, it } from 'vitest';

import { GamePiece, Player } from '@binary-homeworlds/engine';

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
    // Setup: Both players set up homeworlds with a green star, a yellow star, and a yellow ship
    engine.applyAction(createSetupAction('player1', 'green', 1, 'star1'));
    engine.applyAction(createSetupAction('player2', 'green', 1, 'star1'));
    engine.applyAction(createSetupAction('player1', 'yellow', 1, 'star2'));
    engine.applyAction(createSetupAction('player2', 'yellow', 1, 'star2'));
    engine.applyAction(createSetupAction('player1', 'yellow', 1, 'ship'));
    engine.applyAction(createSetupAction('player2', 'yellow', 2, 'ship'));

    // Now both home systems are established, and 6 yellow pieces have been used (2 stars + 1 ship per player)
    let currentPlayer: Player.Player = 'player1';
    let lastShip: Record<Player.Player, GamePiece.PieceId> = {
      player1: 'yellow-1-2',
      player2: 'yellow-2-0',
    };

    // Alternate grow actions until all yellow pieces are gone
    while (true) {
      const growId = pickSmallestAvailable(gameState, 'yellow');
      if (!growId) break;
      const growAction = createGrowAction(
        currentPlayer,
        lastShip[currentPlayer],
        `${currentPlayer}-home`,
        growId
      );
      const result = engine.applyAction(growAction);
      expect(result.error).toBeUndefined();
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
