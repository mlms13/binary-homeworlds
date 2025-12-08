import * as Bank from './Bank';
import { Color, Piece, Size } from './GamePiece';
import { Player } from './Player';
import * as StarSystem from './StarSystem';

export type GameSetupState = {
  tag: 'setup';
  bank: Bank.Bank;
  activePlayer: Player;
  player1HomeSystem: StarSystem.StarSystem;
  player2HomeSystem: StarSystem.StarSystem;
};

export type GameNormalState = {
  tag: 'normal';
  bank: Bank.Bank;
  activePlayer: Player;
  player1HomeSystem: StarSystem.StarSystem;
  player2HomeSystem: StarSystem.StarSystem;
  systems: Array<StarSystem.StarSystem>;
  winner: Player | undefined;
};

export type GameState = GameSetupState | GameNormalState;

export const initial: GameSetupState = {
  tag: 'setup',
  bank: Bank.full,
  activePlayer: 'player1',
  player1HomeSystem: StarSystem.createEmptyHomeSystem('player1'),
  player2HomeSystem: StarSystem.createEmptyHomeSystem('player2'),
};

export const switchActivePlayer = (state: GameState): GameState => {
  return {
    ...state,
    activePlayer: state.activePlayer === 'player1' ? 'player2' : 'player1',
  };
};

export const addPieceToBank = (state: GameState, piece: Piece): GameState => {
  return {
    ...state,
    bank: Bank.addPiece(piece, state.bank),
  };
};

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
