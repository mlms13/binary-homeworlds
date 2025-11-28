/**
 * Utility functions for Binary Homeworlds game
 */

import { Bank, GamePiece, Player } from '@binary-homeworlds/engine';

import { GameState, System } from './types';

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Create a new system
export function createSystem(
  stars: Array<GamePiece.Star>,
  ships: Array<GamePiece.Ship> = []
): System {
  return {
    id: generateId(),
    stars,
    ships,
  };
}

// Check if a color is available at a system for a player
export function isColorAvailable(
  system: System,
  color: GamePiece.Color,
  player: Player.Player
): boolean {
  // Color is available if:
  // 1. The system contains a star of that color, OR
  // 2. The player controls a ship of that color at that system

  const hasStarOfColor = system.stars.some(star => star.color === color);
  const hasShipOfColor = system.ships.some(
    ship => ship.color === color && ship.owner === player
  );

  return hasStarOfColor || hasShipOfColor;
}

// Get all pieces of a specific color in a system (stars + ships)
export function getPiecesOfColor(
  system: System,
  color: GamePiece.Color
): Array<GamePiece.Star | GamePiece.Ship> {
  const stars = system.stars.filter(star => star.color === color);
  const ships = system.ships.filter(ship => ship.color === color);
  return [...stars, ...ships];
}

// Check if a system has overpopulation of a color
export function hasOverpopulation(
  system: System,
  color: GamePiece.Color
): boolean {
  const pieces = getPiecesOfColor(system, color);
  return pieces.length >= 4;
}

// Check if any system has overpopulation
export function findOverpopulation(
  gameState: GameState
): { systemId: string; color: GamePiece.Color } | null {
  for (const system of gameState.systems) {
    for (const color of ['yellow', 'green', 'blue', 'red'] as const) {
      if (hasOverpopulation(system, color)) {
        return { systemId: system.id, color };
      }
    }
  }
  return null;
}

// ============================================================================
// Bank adapter functions - bridge between Engine Bank and Shared Piece[]
// ============================================================================

/**
 * Convert Engine Bank to an array of Pieces
 */
export function bankToPieces(bank: Bank.Bank): Array<GamePiece.Piece> {
  const pieces: Array<GamePiece.Piece> = [];
  const colors: Array<GamePiece.Color> = ['yellow', 'green', 'blue', 'red'];
  const sizes: Array<GamePiece.Size> = [1, 2, 3];

  for (const color of colors) {
    for (const size of sizes) {
      for (const id of bank[color][size]) {
        pieces.push({ color, size, id });
      }
    }
  }

  return pieces;
}

/**
 * Find a piece by ID in Engine Bank
 */
export function findPieceInBank(
  bank: Bank.Bank,
  pieceId: GamePiece.PieceId
): GamePiece.Piece | null {
  const colors: Array<GamePiece.Color> = ['yellow', 'green', 'blue', 'red'];
  const sizes: Array<GamePiece.Size> = [1, 2, 3];

  for (const color of colors) {
    for (const size of sizes) {
      // Engine's Bank stores PieceId[], but we use arbitrary string IDs
      // This is safe at runtime since Engine's Bank just stores strings
      const pieceIds = bank[color][size] as unknown as Array<string>;
      const index = pieceIds.indexOf(pieceId);
      if (index !== -1) {
        return { color, size, id: pieceId };
      }
    }
  }

  return null;
}

/**
 * Remove a piece from Engine Bank by ID
 */
export function removePieceFromBankById(
  bank: Bank.Bank,
  pieceId: GamePiece.PieceId
): [GamePiece.Piece | null, Bank.Bank] {
  const piece = findPieceInBank(bank, pieceId);
  if (!piece) {
    return [null, bank];
  }

  // Create a new bank with the piece removed
  const pieceIds = bank[piece.color][piece.size].filter(id => id !== pieceId);
  const newBank = {
    ...bank,
    [piece.color]: {
      ...bank[piece.color],
      [piece.size]: pieceIds,
    },
  };

  return [piece, newBank];
}

/**
 * Add a piece to Engine Bank
 */
export function addPieceToEngineBank(
  piece: GamePiece.Piece,
  bank: Bank.Bank
): Bank.Bank {
  // Engine's Bank expects PieceId type, but we use arbitrary string IDs
  // This is safe at runtime since Engine's Bank just stores strings
  return Bank.addPiece(
    {
      color: piece.color,
      size: piece.size,
      id: piece.id,
    },
    bank
  );
}

/**
 * Add multiple pieces to Engine Bank
 */
export function addPiecesToEngineBank(
  pieces: Array<GamePiece.Piece>,
  bank: Bank.Bank
): Bank.Bank {
  let result = bank;
  for (const piece of pieces) {
    result = addPieceToEngineBank(piece, result);
  }
  return result;
}

// ============================================================================
// Legacy bank utility functions (now using Engine Bank)
// ============================================================================

/**
 * Get the smallest available size of a color from the bank
 */
export function getSmallestAvailableSize(
  bank: Bank.Bank,
  color: GamePiece.Color
): GamePiece.Size | null {
  const pieces = bankToPieces(bank);
  const availableSizes = pieces
    .filter(piece => piece.color === color)
    .map(piece => piece.size)
    .sort((a, b) => a - b);

  return availableSizes.length > 0 ? (availableSizes[0] ?? null) : null;
}

/**
 * Remove a piece from bank by ID (legacy function signature)
 * Note: This returns a new bank (immutable), unlike the old mutable version
 */
export function removePieceFromBank(
  bank: Bank.Bank,
  pieceId: GamePiece.PieceId
): [GamePiece.Piece | null, Bank.Bank] {
  return removePieceFromBankById(bank, pieceId);
}

// Find a system by ID
export function findSystem(
  gameState: GameState,
  systemId: string
): System | undefined {
  return gameState.systems.find(system => system.id === systemId);
}

// Find a ship by ID across all systems
export function findShip(
  gameState: GameState,
  shipId: GamePiece.PieceId
): { ship: GamePiece.Ship; system: System } | undefined {
  return gameState.systems.reduce<
    { ship: GamePiece.Ship; system: System } | undefined
  >((acc, system) => {
    const ship = system.ships.find(ship => ship.id === shipId);
    if (!acc && ship) return { ship, system };
    return acc;
  }, undefined);
}

// Check if a player has any ships at their home system
export function hasShipsAtHome(
  gameState: GameState,
  player: Player.Player
): boolean {
  const homeSystemId = gameState.players[player].homeSystemId;
  const homeSystem = findSystem(gameState, homeSystemId);

  if (!homeSystem) return false;

  return homeSystem.ships.some(ship => ship.owner === player);
}

// Check if a player's home system has any stars
export function hasStarsAtHome(
  gameState: GameState,
  player: Player.Player
): boolean {
  const homeSystemId = gameState.players[player].homeSystemId;
  const homeSystem = findSystem(gameState, homeSystemId);

  if (!homeSystem) return false;

  return homeSystem.stars.length > 0;
}

// Check if the game has ended and return the winner
export function checkGameEnd(gameState: GameState): Player.Player | null {
  for (const player of ['player1', 'player2'] as const) {
    const hasShips = hasShipsAtHome(gameState, player);
    const hasStars = hasStarsAtHome(gameState, player);

    // Player loses if they have no ships at home OR no stars at home
    if (!hasShips || !hasStars) {
      return player === 'player1' ? 'player2' : 'player1';
    }
  }

  return null;
}

// Get the other player
export function getOtherPlayer(player: Player.Player): Player.Player {
  return player === 'player1' ? 'player2' : 'player1';
}

// Deep clone a game state (for immutability)
export function cloneGameState(gameState: GameState): GameState {
  return JSON.parse(JSON.stringify(gameState));
}
