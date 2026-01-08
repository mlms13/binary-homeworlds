import * as Bank from './Bank';
import { Color, Piece, Ship, Size, Star } from './GamePiece';
import { Player } from './Player';
import {
  createEmptyHomeSystem,
  StarSystem,
  StarSystemId,
  validate as validateStarSystem,
} from './StarSystem';

type GameCommonState = {
  bank: Bank.Bank;
  activePlayer: Player;
  homeSystems: Record<Player, StarSystem>;
};

type SetupState = GameCommonState & { tag: 'setup' };

type NormalState = GameCommonState & {
  tag: 'normal';
  systems: Array<StarSystem>;
  winner: Player | undefined;
};

type AnyState = SetupState | NormalState;

type StateMap = {
  [K in AnyState['tag']]: Extract<AnyState, { tag: K }>;
};

export type GameState<T extends keyof StateMap = keyof StateMap> = StateMap[T];

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
export const initial = (): GameState<'setup'> => ({
  tag: 'setup',
  bank: Bank.full,
  activePlayer: 'player1',
  homeSystems: {
    player1: createEmptyHomeSystem('player1'),
    player2: createEmptyHomeSystem('player2'),
  },
});

/**
 * `maybeToNormal` will attempt to switch the game state to a "normal" state.
 *
 * If the provided state is not in "setup" (i.e. already in "normal" state), or
 * the home systems are not currently valid, the original state is returned.
 * Otherwise, the state is switched to "normal" and the systems and winner are
 * set to empty.
 */
export const maybeToNormal = (state: GameState): GameState => {
  const homeSystemsValid =
    validateStarSystem(state.homeSystems.player1).valid &&
    validateStarSystem(state.homeSystems.player2).valid;

  if (state.tag !== 'setup' || !homeSystemsValid) return state;

  return { ...state, tag: 'normal', systems: [], winner: undefined };
};

/**
 * Switch the active player to the next player.
 */
export const switchActivePlayer = <State extends AnyState>(
  state: State
): State => {
  return {
    ...state,
    activePlayer: state.activePlayer === 'player1' ? 'player2' : 'player1',
  };
};

/**
 * Add a piece to the bank.
 *
 * BKMRK: should this just be internal?
 */
export const addPieceToBank = <State extends AnyState>(
  piece: Piece,
  state: State
): State => {
  return { ...state, bank: Bank.addPiece(piece, state.bank) };
};

/**
 * Take a piece from the bank, returning the piece and the updated game state
 * with the piece removed from the bank.
 */
export const takePieceFromBank = <State extends AnyState>(
  size: Size,
  color: Color,
  state: State
): [Piece | undefined, State] => {
  const [piece, bank] = Bank.takePieceBySizeAndColor(size, color, state.bank);
  if (!piece) return [undefined, state];

  return [piece, { ...state, bank }];
};

/**
 * Get all systems, including the home systems.
 */
export const getAllSystems = (state: GameState): Array<StarSystem> => {
  const homeSystems = [state.homeSystems.player1, state.homeSystems.player2];
  switch (state.tag) {
    case 'setup':
      return homeSystems;
    case 'normal':
      return [...state.systems, ...homeSystems];
  }
};

/**
 * Find a system by ID.
 */
export const findSystem = (
  systemId: StarSystemId,
  state: GameState
): StarSystem | undefined => {
  return getAllSystems(state).find(system => system.id === systemId);
};

/**
 * Determine whether a system is in the game state.
 */
export const hasSystem = (system: StarSystem, state: GameState): boolean => {
  return getAllSystems(state).some(s => s.id === system.id);
};

export const addSystem = (
  system: StarSystem,
  state: GameState<'normal'>
): GameState<'normal'> => {
  return {
    ...state,
    systems: [...state.systems, system],
  };
};

const setHomeSystem = <State extends AnyState>(
  player: Player,
  stars: Array<Star>,
  ships: Array<Ship>,
  state: State
): State => {
  return {
    ...state,
    homeSystems: {
      ...state.homeSystems,
      [player]: { ...state.homeSystems[player], stars, ships },
    },
  };
};

/**
 * Add a system to the game state.
 */
const removeSystem = <State extends AnyState>(
  system: StarSystem,
  state: State
): State => {
  if (system.id === 'player1-home')
    return setHomeSystem('player1', [], [], state);
  if (system.id === 'player2-home')
    return setHomeSystem('player2', [], [], state);

  if (state.tag === 'setup') return state;

  return {
    ...state,
    systems: state.systems.filter(s => s.id !== system.id),
  };
};

const setSystem = <State extends AnyState>(
  system: StarSystem,
  state: State
): State => {
  if (system.id === 'player1-home')
    return setHomeSystem('player1', system.stars, system.ships, state);
  if (system.id === 'player2-home')
    return setHomeSystem('player2', system.stars, system.ships, state);

  if (state.tag === 'setup') return state;

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
export const setSystemWithCleanup = <State extends AnyState>(
  system: StarSystem,
  state: State
): State => {
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
