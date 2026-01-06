import * as Bank from './Bank';
import { Color, Piece, Ship, Size, Star } from './GamePiece';
import { Player } from './Player';
import {
  addShip,
  addStar,
  createEmptyHomeSystem,
  createNormal as createNormalStarSystem,
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
 * Set the stars and ships at a players home system to the provided values. This
 * does not validate the resulting state of the home system.
 */
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
 * This is an "unsafe" internal helper that will return an updated state with
 * the provided system replacing the existing system. If provided system doesn't
 * exist in the current state, the original state is returned.
 *
 * While this is useful internally, the outside world will always prefer
 * `setSystemWithCleanup` which determines when the new system is invalid and
 * returns its pieces to the bank.
 */
const setSystem = <State extends AnyState>(
  system: StarSystem,
  state: State
): State => {
  if (system.id === 'player1-home')
    return setHomeSystem('player1', system.stars, system.ships, state);

  if (system.id === 'player2-home')
    return setHomeSystem('player2', system.stars, system.ships, state);

  // no normal systems can be set during setup
  if (state.tag === 'setup') return state;

  // if the target system can't be found, also return the original state
  if (!findSystem(system.id, state)) return state;

  return {
    ...state,
    systems: state.systems.map(s => (s.id === system.id ? system : s)),
  };
};

/**
 * Add a system to the game state
 *
 * BKMRK: if this is only internal, we should un-export it
 */
export const addSystem = (
  system: StarSystem,
  state: GameState<'normal'>
): GameState<'normal'> => {
  return { ...state, systems: [...state.systems, system] };
};

/**
 * Given a "normal" game state, this adds a new star system using the provided
 * color and size. It returns an updated state with both the systems and bank
 * set appropriately.
 *
 * If the bank doesn't contain a piece of the requested color/size, the original
 * state is returned.
 */
export const createSystem = (
  state: GameState<'normal'>,
  size: Size,
  color: Color,
  ships?: Array<Ship>
): [StarSystemId | undefined, GameState<'normal'>] => {
  const [piece, updated] = takePieceFromBank(size, color, state);

  if (!piece) return [undefined, state];

  const newSystem = createNormalStarSystem(piece, ships);
  return [newSystem.id, addSystem(newSystem, updated)];
};

/**
 * Remove a system by ID. If the provided system ID is a homeworld, all ships
 * and star pieces will be removed, but the homeworld will still exist
 */
export const removeSystemById = <State extends AnyState>(
  id: StarSystemId,
  state: State
): State => {
  if (id === 'player1-home') return setHomeSystem('player1', [], [], state);
  if (id === 'player2-home') return setHomeSystem('player2', [], [], state);

  // if we're trying to remove a normal system and we're still in setup, that
  // doesn't make sense, so we just return the unchanged state
  if (state.tag === 'setup') return state;

  return {
    ...state,
    systems: state.systems.filter(s => s.id !== id),
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
  // attempt to set the system
  const updated = setSystem(system, state);

  // if no change was made, there should also be nothing to clean up
  if (updated === state) return state;

  // if we made a change, we need to check to see if the new system is invalid.
  // if so, we remove it from the state and return its pieces to the bank.
  const validation = validateStarSystem(system);

  // if valid, return the updated state
  if (validation.valid) return updated;

  // but if the system is invalid, remove it and return its pieces
  return removeSystemById(system.id, {
    ...updated,
    bank: Bank.addPieces(validation.piecesToCleanUp, state.bank),
  });
};

export const addStarToHomeSystem = <State extends AnyState>(
  player: Player,
  size: Size,
  color: Color,
  state: State
): State => {
  const [piece, updated] = takePieceFromBank(size, color, state);
  if (!piece) return state;

  return setSystem(addStar(piece, state.homeSystems[player]), updated);
};

export const addShipToHomeSystem = <State extends AnyState>(
  player: Player,
  size: Size,
  color: Color,
  state: State
): State => {
  const [piece, updated] = takePieceFromBank(size, color, state);
  if (!piece) return state;

  const ship = { ...piece, owner: player };
  return setSystem(addShip(ship, state.homeSystems[player]), updated);
};
