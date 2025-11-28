/**
 * Utility functions for Binary Homeworlds game
 */

import {
  Color,
  GameState,
  Piece,
  Player,
  Ship,
  Size,
  Star,
  System,
} from './types.js';

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Create a new piece
export function createPiece(color: Color, size: Size): Piece {
  return {
    color,
    size,
    id: generateId(),
  };
}

// Create a new ship
export function createShip(color: Color, size: Size, owner: Player): Ship {
  return {
    color,
    size,
    owner,
    id: generateId(),
  };
}

// Create a new star
export function createStar(color: Color, size: Size): Star {
  return {
    color,
    size,
    id: generateId(),
  };
}

// Create a new system
export function createSystem(stars: Star[], ships: Ship[] = []): System {
  return {
    id: generateId(),
    stars,
    ships,
  };
}

// Check if a color is available at a system for a player
export function isColorAvailable(
  system: System,
  color: Color,
  player: Player
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
  color: Color
): (Star | Ship)[] {
  const stars = system.stars.filter(star => star.color === color);
  const ships = system.ships.filter(ship => ship.color === color);
  return [...stars, ...ships];
}

// Check if a system has overpopulation of a color
export function hasOverpopulation(system: System, color: Color): boolean {
  const pieces = getPiecesOfColor(system, color);
  return pieces.length >= 4;
}

// Check if any system has overpopulation
export function findOverpopulation(
  gameState: GameState
): { systemId: string; color: Color } | null {
  for (const system of gameState.systems) {
    for (const color of ['yellow', 'green', 'blue', 'red'] as Color[]) {
      if (hasOverpopulation(system, color)) {
        return { systemId: system.id, color };
      }
    }
  }
  return null;
}

// Get the smallest available size of a color from the bank
export function getSmallestAvailableSize(
  bank: Piece[],
  color: Color
): Size | null {
  const availableSizes = bank
    .filter(piece => piece.color === color)
    .map(piece => piece.size)
    .sort((a, b) => a - b);

  return availableSizes.length > 0 ? (availableSizes[0] ?? null) : null;
}

// Check if a piece of specific color and size is available in bank
export function isPieceAvailableInBank(
  bank: Piece[],
  color: Color,
  size: Size
): boolean {
  return bank.some(piece => piece.color === color && piece.size === size);
}

// Remove a piece from bank by ID
export function removePieceFromBank(
  bank: Piece[],
  pieceId: string
): Piece | null {
  const index = bank.findIndex(piece => piece.id === pieceId);
  if (index === -1) return null;

  const [removed] = bank.splice(index, 1);
  return removed ?? null;
}

// Add a piece to bank
export function addPieceToBank(bank: Piece[], piece: Piece): void {
  bank.push(piece);
}

// Find a system by ID
export function findSystem(
  gameState: GameState,
  systemId: string
): System | null {
  return gameState.systems.find(system => system.id === systemId) || null;
}

// Find a ship by ID across all systems
export function findShip(
  gameState: GameState,
  shipId: string
): { ship: Ship; system: System } | null {
  for (const system of gameState.systems) {
    const ship = system.ships.find(s => s.id === shipId);
    if (ship) {
      return { ship, system };
    }
  }
  return null;
}

// Check if a player has any ships at their home system
export function hasShipsAtHome(gameState: GameState, player: Player): boolean {
  const homeSystemId = gameState.players[player].homeSystemId;
  const homeSystem = findSystem(gameState, homeSystemId);

  if (!homeSystem) return false;

  return homeSystem.ships.some(ship => ship.owner === player);
}

// Check if a player's home system has any stars
export function hasStarsAtHome(gameState: GameState, player: Player): boolean {
  const homeSystemId = gameState.players[player].homeSystemId;
  const homeSystem = findSystem(gameState, homeSystemId);

  if (!homeSystem) return false;

  return homeSystem.stars.length > 0;
}

// Check if the game has ended and return the winner
export function checkGameEnd(gameState: GameState): Player | null {
  for (const player of ['player1', 'player2'] as Player[]) {
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
export function getOtherPlayer(player: Player): Player {
  return player === 'player1' ? 'player2' : 'player1';
}

// Deep clone a game state (for immutability)
export function cloneGameState(gameState: GameState): GameState {
  return JSON.parse(JSON.stringify(gameState));
}
