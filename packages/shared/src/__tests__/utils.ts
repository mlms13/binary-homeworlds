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
  const initialActions = [
    createSetupAction('player1', 'blue', 3, 'star1'),
    createSetupAction('player2', 'yellow', 2, 'star1'),
    createSetupAction('player1', 'yellow', 1, 'star2'),
    createSetupAction('player2', 'green', 1, 'star2'),
    createSetupAction('player1', 'green', 3, 'ship'),
    createSetupAction('player2', 'red', 3, 'ship'),
  ];

  return GameEngine.fromHistory(initialActions);
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
