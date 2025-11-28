// test helpers to make it easy to get the game into a particular state

import { createSetupAction } from '../action-builders';
import { GameEngine } from '../game-engine';
import { Color, Piece, Size } from '../types';
import { generateId } from '../utils';

// completes the setup phase, resulting in:
// - player 1: large blue star, small yellow star, large green ship
// - player 2: medium yellow star, small green star, large red ship
export function createNormalGameSetup() {
  const engine = new GameEngine();
  // Player 1 chooses first star (large blue)
  engine.applyAction(createSetupAction('player1', 'p1-star1', 'star1'));

  // Player 2 chooses first star (medium yellow)
  engine.applyAction(createSetupAction('player2', 'p2-star1', 'star1'));

  // Player 1 chooses second star (small yellow)
  engine.applyAction(createSetupAction('player1', 'p1-star2', 'star2'));

  // Player 2 chooses second star (small green)
  engine.applyAction(createSetupAction('player2', 'p2-star2', 'star2'));

  // Player 1 chooses ship (large green)
  engine.applyAction(createSetupAction('player1', 'p1-ship', 'ship'));

  // Player 2 chooses ship (large red)
  engine.applyAction(createSetupAction('player2', 'p2-ship', 'ship'));
}

// Create a new piece (for testing only)
export function createPiece(color: Color, size: Size): Piece {
  return {
    color,
    size,
    id: generateId(),
  };
}
