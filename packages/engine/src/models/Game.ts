import * as Bank from './Bank';
import { Color, Piece, Size } from './GamePiece';
import { Player } from './Player';
import { createEmptyHomeSystem, StarSystem } from './StarSystem';

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
 */
export const addPieceToBank = <State extends AnyState>(
  piece: Piece,
  state: State
): State => {
  return {
    ...state,
    bank: Bank.addPiece(piece, state.bank),
  };
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
  if (!piece) {
    return [undefined, state];
  }
  return [piece, { ...state, bank }];
};

/**
 * Get all systems, including the home systems.
 */
export const getAllSystems = (state: GameState): Array<StarSystem> => {
  const normalSystems = state.tag === 'normal' ? state.systems : [];
  const homeSystems = [state.homeSystems.player1, state.homeSystems.player2];
  return [...normalSystems, ...homeSystems];
};
