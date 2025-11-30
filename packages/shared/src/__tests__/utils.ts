// test helpers to make it easy to get the game into a particular state

import { GamePiece, Player } from '@binary-homeworlds/engine';

import { createSetupAction } from '../action-builders';
import { GameEngine } from '../game-engine';

// Helper to generate a valid PieceId for testing
// Format: ${Color}-${Size}-${0 | 1 | 2}
let pieceIdCounter = 0;
function generatePieceId(
  color: GamePiece.Color,
  size: GamePiece.Size
): GamePiece.PieceId {
  const index = pieceIdCounter % 3;
  pieceIdCounter++;
  return `${color}-${size}-${index}` as GamePiece.PieceId;
}

// Helper to get a PieceId from the bank for a given color/size
// Useful for tests that need to select pieces from the bank
export function getPieceIdFromBank(
  engine: GameEngine,
  color: GamePiece.Color,
  size: GamePiece.Size
): GamePiece.PieceId | undefined {
  const pieces = engine
    .getGameState()
    .getBankPieces()
    .filter(p => p.color === color && p.size === size);
  return pieces[0]?.id;
}

// completes the setup phase, resulting in:
// - player 1: large blue star, small yellow star, large green ship
// - player 2: medium yellow star, small green star, large red ship
export function createNormalGameSetup() {
  const engine = new GameEngine();
  // Player 1 chooses first star (large blue)
  const p1Star1 = getPieceIdFromBank(engine, 'blue', 3);
  if (!p1Star1) throw new Error('No blue size 3 piece available');
  engine.applyAction(createSetupAction('player1', p1Star1, 'star1'));

  // Player 2 chooses first star (medium yellow)
  const p2Star1 = getPieceIdFromBank(engine, 'yellow', 2);
  if (!p2Star1) throw new Error('No yellow size 2 piece available');
  engine.applyAction(createSetupAction('player2', p2Star1, 'star1'));

  // Player 1 chooses second star (small yellow)
  const p1Star2 = getPieceIdFromBank(engine, 'yellow', 1);
  if (!p1Star2) throw new Error('No yellow size 1 piece available');
  engine.applyAction(createSetupAction('player1', p1Star2, 'star2'));

  // Player 2 chooses second star (small green)
  const p2Star2 = getPieceIdFromBank(engine, 'green', 1);
  if (!p2Star2) throw new Error('No green size 1 piece available');
  engine.applyAction(createSetupAction('player2', p2Star2, 'star2'));

  // Player 1 chooses ship (large green)
  const p1Ship = getPieceIdFromBank(engine, 'green', 3);
  if (!p1Ship) throw new Error('No green size 3 piece available');
  engine.applyAction(createSetupAction('player1', p1Ship, 'ship'));

  // Player 2 chooses ship (large red)
  const p2Ship = getPieceIdFromBank(engine, 'red', 3);
  if (!p2Ship) throw new Error('No red size 3 piece available');
  engine.applyAction(createSetupAction('player2', p2Ship, 'ship'));
}

// Create a new ship (for testing only)
export function createShip(
  color: GamePiece.Color,
  size: GamePiece.Size,
  owner: Player.Player
): GamePiece.Ship {
  return {
    color,
    size,
    owner,
    id: generatePieceId(color, size),
  };
}
