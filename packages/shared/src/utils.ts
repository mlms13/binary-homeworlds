/**
 * Utility functions for Binary Homeworlds game
 */

import { Bank, GamePiece, Player, StarSystem } from '@binary-homeworlds/engine';

import { GameState } from './types';

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

export function getAllSystems(
  gameState: GameState
): Array<StarSystem.StarSystem> {
  return [
    ...gameState.systems,
    gameState.homeSystems.player1,
    gameState.homeSystems.player2,
  ];
}

// Find a system by ID
export function findSystem(
  gameState: GameState,
  systemId: string
): StarSystem.StarSystem | undefined {
  return getAllSystems(gameState).find(system => system.id === systemId);
}

// Find a ship by ID across all systems
export function findShip(
  gameState: GameState,
  shipId: GamePiece.PieceId
): { ship: GamePiece.Ship; system: StarSystem.StarSystem } | undefined {
  return getAllSystems(gameState).reduce<
    { ship: GamePiece.Ship; system: StarSystem.StarSystem } | undefined
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
  const homeSystem = gameState.homeSystems[player];
  return homeSystem.ships.some(ship => ship.owner === player);
}

// Check if a player's home system has any stars
export function hasStarsAtHome(
  gameState: GameState,
  player: Player.Player
): boolean {
  const homeSystem = gameState.homeSystems[player];
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

// Deep clone a game state (for immutability)
export function cloneGameState(gameState: GameState): GameState {
  return JSON.parse(JSON.stringify(gameState));
}
