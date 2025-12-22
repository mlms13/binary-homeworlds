import * as Bank from './Bank';
import { Color, Piece, Size } from './GamePiece';
import { Player } from './Player';
import { createEmptyHomeSystem, StarSystem } from './StarSystem';

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
