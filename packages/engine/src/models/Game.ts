import * as Bank from './Bank';
import { Color, Piece, Ship, Size, Star } from './GamePiece';
import { Player } from './Player';
import {
  createEmptyHomeSystem,
  StarSystem,
  validate as validateStarSystem,
} from './StarSystem';

type GameCommonState = {
  bank: Bank.Bank;
  activePlayer: Player;
  homeSystems: Record<Player, StarSystem>;
};

export type GameSetupState = GameCommonState & {
  tag: 'setup';
};

export type GameNormalState = GameCommonState & {
  tag: 'normal';
  systems: Array<StarSystem>;
  winner: Player | undefined;
};

export type GameState = GameSetupState | GameNormalState;

/**
 * Returns a fresh initial game state. This is a function rather than a constant
 * to prevent mutations from affecting the shared initial state across test runs
 * or multiple game instances.
 *
 * The returned state is a setup state with the bank full and the active player
 * set to player1. Both players have empty home systems.
 *
 * Note: In the future, we could enforce immutability at the type level using
 * TypeScript's `readonly` modifiers or libraries like `immer` to prevent
 * accidental mutations of game state.
 */
export const initial = (): GameSetupState => ({
  tag: 'setup',
  bank: Bank.full,
  activePlayer: 'player1',
  homeSystems: {
    player1: createEmptyHomeSystem('player1'),
    player2: createEmptyHomeSystem('player2'),
  },
});

/**
 * Get the home system for a player.
 */
export const getHomeSystem = (player: Player, state: GameState): StarSystem => {
  switch (player) {
    case 'player1':
      return state.homeSystems.player1;
    case 'player2':
      return state.homeSystems.player2;
  }
};

/**
 * Switch the active player to the next player.
 */
export const switchActivePlayer = (state: GameState): GameState => {
  return {
    ...state,
    activePlayer: state.activePlayer === 'player1' ? 'player2' : 'player1',
  };
};

/**
 * Add a piece to the bank.
 */
export const addPieceToBank = (piece: Piece, state: GameState): GameState => {
  return {
    ...state,
    bank: Bank.addPiece(piece, state.bank),
  };
};

/**
 * Take a piece from the bank, returning the piece and the updated game state
 * with the piece removed from the bank.
 */
export const takePieceFromBank = (
  size: Size,
  color: Color,
  state: GameState
): [Piece | undefined, GameState] => {
  const [piece, bank] = Bank.takePieceBySizeAndColor(size, color, state.bank);
  if (!piece) {
    return [undefined, state];
  }
  return [piece, { ...state, bank }];
};

export const getAllSystems = (state: GameState): Array<StarSystem> => {
  const normalSystems = state.tag === 'normal' ? state.systems : [];
  const homeSystems = [state.homeSystems.player1, state.homeSystems.player2];
  return [...normalSystems, ...homeSystems];
};

/**
 * Determine whether a system is in the game state.
 */
export const hasSystem = (system: StarSystem, state: GameState): boolean => {
  return getAllSystems(state).some(s => s.id === system.id);
};

/**
 * Add a system to the game state.
 */
export const addSystem = (
  system: StarSystem,
  state: GameNormalState
): GameNormalState => {
  return {
    ...state,
    systems: [...state.systems, system],
  };
};

const setHomeSystem = (
  player: Player,
  stars: Array<Star>,
  ships: Array<Ship>,
  state: GameNormalState
): GameNormalState => {
  return {
    ...state,
    homeSystems: {
      ...state.homeSystems,
      [player]: { ...state.homeSystems[player], stars, ships },
    },
  };
};

const removeSystem = (
  system: StarSystem,
  state: GameNormalState
): GameNormalState => {
  if (system.id === 'player1-home')
    return setHomeSystem('player1', [], [], state);
  if (system.id === 'player2-home')
    return setHomeSystem('player2', [], [], state);

  return {
    ...state,
    systems: state.systems.filter(s => s.id !== system.id),
  };
};

const setSystem = (
  system: StarSystem,
  state: GameNormalState
): GameNormalState => {
  if (system.id === 'player1-home')
    return setHomeSystem('player1', system.stars, system.ships, state);
  if (system.id === 'player2-home')
    return setHomeSystem('player2', system.stars, system.ships, state);

  return {
    ...state,
    systems: state.systems.map(s => (s.id === system.id ? system : s)),
  };
};

/**
 * Immutably update a system in the game state. If the provided system is not
 * found in the game state, the provided game state is returned unchanged. If
 * the provided system is invalid, it is removed from the game state and its
 * pieces are returned to the bank.
 */
export const setSystemWithCleanup = (
  system: StarSystem,
  state: GameNormalState
): GameNormalState => {
  // if the system is not found in the state, return the original game state
  if (!hasSystem(system, state)) {
    return state;
  }

  // if the system is invalid, return an updated game state with the system
  // filtered out and its pieces returned to the bank
  const validation = validateStarSystem(system);
  if (!validation.valid) {
    // return the pieces to the bank
    return removeSystem(system, {
      ...state,
      bank: Bank.addPieces(validation.piecesToCleanUp, state.bank),
    });
  }

  // if the system *is* valid, replace the system in the game state with the new
  // system and return the updated game state
  return setSystem(system, state);
};
