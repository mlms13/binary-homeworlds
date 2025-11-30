import {
  Color,
  Piece,
  PieceId,
  Ship,
  shipToPiece,
  Star,
  switchShipOwner,
} from './GamePiece';
import { Player } from './Player';

// star system IDs either match the star piece of the system or they are one
// of the two player home systems (with two stars, so they get a special ID)
export type StarSystemId = PieceId | `${Player}-home`;

export type StarSystem = {
  id: StarSystemId;
  stars: Array<Star>;
  ships: Array<Ship>;
};

/**
 * Result of validating a star system. If the system is invalid (no stars),
 * it contains all pieces that should be returned to the bank.
 */
export type SystemValidationResult =
  | { valid: true }
  | { valid: false; piecesToCleanUp: Array<Piece> };

/**
 * Create a "normal" star system (one with a single star and any number of
 * initial ships).
 */
export const createNormal = (
  star: Star,
  ships: Array<Ship> = []
): StarSystem => {
  return {
    id: star.id,
    stars: [star],
    ships,
  };
};

/**
 * Create a binary star system (one with two stars) for a specific player to
 * use as their home system.
 */
export const createBinary = (
  player: Player,
  star1: Star,
  star2: Star,
  ships: Array<Ship> = []
): StarSystem => {
  return {
    id: `${player}-home`,
    stars: [star1, star2],
    ships,
  };
};

/**
 * Validate a star system. A system is invalid if it has no stars.
 * If invalid, returns all remaining pieces (stars + ships) that should be
 * returned to the bank.
 *
 * According to game rules:
 * - A system must have at least one star to be valid
 * - A system must have at least one ship to be valid
 * - If a system becomes invalid (no stars or no ships), all remaining ships
 *   must be returned to the bank
 */
export const validate = (system: StarSystem): SystemValidationResult => {
  if (system.stars.length === 0) {
    // No stars? Return all ships to the bank.
    const piecesToCleanUp = system.ships.map(shipToPiece);
    return { valid: false, piecesToCleanUp };
  }
  if (system.ships.length === 0) {
    // No ships? Return all stars to the bank.
    return { valid: false, piecesToCleanUp: system.stars };
  }
  return { valid: true };
};

/**
 * Get a ship from a system by its ID.
 */
export const getShip = (
  shipId: PieceId,
  system: StarSystem
): Ship | undefined => {
  return system.ships.find(s => s.id === shipId);
};

/**
 * Determine whether a star system contains a particular ship.
 */
export const hasShip = (ship: Ship, system: StarSystem): boolean => {
  return !!getShip(ship.id, system);
};

/**
 * Immutably add a new ship to a system.
 */
export const addShip = (ship: Ship, system: StarSystem): StarSystem => {
  return {
    ...system,
    ships: [...system.ships, ship],
  };
};

/**
 * Immutably add a new star to a system.
 *
 * While this won't happen during regular gameplay, it's useful for setup.
 */
export const addStar = (star: Star, system: StarSystem): StarSystem => {
  return {
    ...system,
    stars: [...system.stars, star],
  };
};

/**
 * Get all pieces (stars and ships) from the system.
 */
export const getPieces = (system: StarSystem): Array<Piece> => {
  return [...system.stars, ...system.ships.map(shipToPiece)];
};

/**
 * Immutably remove a ship from a system, returning the removed piece and the
 * updated system.
 *
 * If the ship is not found in the system, `undefined` is returned instead of
 * the piece, and the original system is returned with no updates.
 *
 * Note: After calling this, you should call `validateSystem` to check if the
 * system is still valid. If invalid, return all remaining pieces to the bank and remove
 * the system.
 */
export const removeShip = (
  ship: Ship,
  system: StarSystem
): [Piece | undefined, StarSystem] => {
  const origLength = system.ships.length;
  const withoutShip = system.ships.filter(s => s.id !== ship.id);

  if (withoutShip.length === origLength) {
    return [undefined, system];
  }

  return [ship, { ...system, ships: withoutShip }];
};

/**
 * Immutably remove all pieces (stars and ships) of a given color from a system,
 * returning the removed pieces and the updated system.
 *
 * This is used for handling overpopulation scenarios.
 *
 * Note: After calling this, you should call `validateSystem` to check if the
 * system is still valid. If invalid (no stars or no ships remain), return all
 * pieces to the bank and remove the system.
 */
export const removePiecesOfColor = (
  system: StarSystem,
  color: Color
): [Array<Piece>, StarSystem] => {
  const removedStars = system.stars.filter(star => star.color === color);
  const removedShips = system.ships.filter(ship => ship.color === color);

  const remainingStars = system.stars.filter(star => star.color !== color);
  const remainingShips = system.ships.filter(ship => ship.color !== color);

  const removedPieces = [...removedStars, ...removedShips.map(shipToPiece)];

  return [
    removedPieces,
    {
      ...system,
      stars: remainingStars,
      ships: remainingShips,
    },
  ];
};

/**
 * Given a star system, return all colors that have overpopulation, where
 * overpopulation is defined as having 4 or more pieces of the same color.
 */
export const getOverpopulations = (system: StarSystem): Array<Color> => {
  // partition all pieces (stars and ships) by color
  const piecesByColor = getPieces(system).reduce<Record<Color, number>>(
    (acc, piece) => {
      acc[piece.color] = acc[piece.color] + 1;
      return acc;
    },
    { yellow: 0, green: 0, blue: 0, red: 0 }
  );

  return Object.entries(piecesByColor)
    .filter(([_, count]) => count >= 4)
    .map(([color]) => color as Color);
};

/**
 * Determine whether a system has overpopulation of a given color.
 */
export const hasOverpopulation = (
  system: StarSystem,
  color: Color
): boolean => {
  return getOverpopulations(system).includes(color);
};

/**
 * Immutably change the owner of a ship in a system.
 */
export const changeShipOwner = (ship: Ship, system: StarSystem): StarSystem => {
  return {
    ...system,
    ships: system.ships.map(s => (s.id === ship.id ? switchShipOwner(s) : s)),
  };
};

/**
 * Get all ships owned by a player in a system.
 */
export const getPlayerShips = (
  player: Player,
  system: StarSystem
): Array<Ship> => {
  return system.ships.filter(s => s.owner === player);
};

/**
 * Get all colors that are available to a player at a system. This determines
 * which actions are available to the player at that system. The set of colors
 * is the union of the player's ship colors and the star colors.
 */
export const getAvailableColors = (
  player: Player,
  system: StarSystem
): Set<Color> => {
  const playerShipColors = getPlayerShips(player, system).map(s => s.color);
  const starColors = system.stars.map(s => s.color);

  return new Set([...playerShipColors, ...starColors]);
};

/**
 * Determine whether a color is available to a player at a system.
 */
export const isColorAvailable = (
  player: Player,
  color: Color,
  system: StarSystem
): boolean => {
  return getAvailableColors(player, system).has(color);
};
