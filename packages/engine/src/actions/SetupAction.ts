import * as Bank from '../models/Bank';
import {
  addShipToHomeSystem,
  addStarToHomeSystem,
  GameState,
  maybeToNormal,
} from '../models/Game';
import { Color, Size } from '../models/GamePiece';
import { getOtherPlayer, Player } from '../models/Player';
import * as ValidationResult from '../models/ValidationResult';

export type TakeStarAction = {
  type: 'setup:take_star';
  color: Color;
  size: Size;
  player: Player;
};

export type TakeShipAction = {
  type: 'setup:take_ship';
  color: Color;
  size: Size;
  player: Player;
};

export type SetupAction = TakeStarAction | TakeShipAction;

export const takeStarAction = (
  color: Color,
  size: Size,
  player: Player
): TakeStarAction => ({
  type: 'setup:take_star',
  color,
  size,
  player,
});

export const takeShipAction = (
  color: Color,
  size: Size,
  player: Player
): TakeShipAction => ({
  type: 'setup:take_ship',
  color,
  size,
  player,
});

/**
 * Validates a setup action against the current game state.
 * Returns `{ valid: true }` if the action is legal, or
 * `{ valid: false, error: ValidationError }` with a typed error if invalid.
 */
export const validate = (
  state: GameState<'setup'>,
  action: SetupAction
): ValidationResult.ValidationResult => {
  // Only the active player can make a move
  if (state.activePlayer !== action.player) {
    return ValidationResult.wrongPlayer({
      expected: state.activePlayer,
      actual: action.player,
    });
  }

  // Check that the piece exists in the bank
  if (!Bank.hasPieceBySizeAndColor(action.size, action.color, state.bank)) {
    return ValidationResult.pieceNotInBank(action.color, action.size);
  }

  // When taking a star, check that the player has not already taken two stars
  const playerHomeSystem = state.homeSystems[action.player];
  if (action.type === 'setup:take_star' && playerHomeSystem.stars.length >= 2) {
    return ValidationResult.homeSystemAlreadyHasTwoStars(action.player);
  }

  // When taking a ship, check that the player has already taken two stars
  if (action.type === 'setup:take_ship' && playerHomeSystem.stars.length < 2) {
    return ValidationResult.homeSystemNeedsTwoStars(action.player);
  }

  // We could also prevent the player from taking a second ship, but there's
  // actually no way to trigger that validation. Either the player would try
  // to take a second ship when it's not their turn (which we catch above), or
  // the game would have moved on to the "normal" phase (which we also catch).

  return ValidationResult.valid();
};

const applyTakeStarAction = (
  state: GameState<'setup'>,
  { color, size, player }: TakeStarAction
): GameState<'setup'> => {
  // We don't validate actions here. If the piece isn't in the bank, we expect
  // that to have already been caught. If the bank doesn't have the piece, our
  // call to `addStarToHomeSystem` will return an unchanged state, which we also
  // return here (without switching players).
  const updated = addStarToHomeSystem(player, size, color, state);

  if (updated === state) return state;
  return { ...updated, activePlayer: getOtherPlayer(state.activePlayer) };
};

const applyTakeShipAction = (
  state: GameState<'setup'>,
  { color, size, player }: TakeShipAction
): GameState => {
  const updated = addShipToHomeSystem(player, size, color, state);

  if (updated === state) return state;
  return {
    ...maybeToNormal(updated),
    activePlayer: getOtherPlayer(state.activePlayer),
  };
};

export const apply = (
  state: GameState<'setup'>,
  action: SetupAction
): GameState => {
  switch (action.type) {
    case 'setup:take_star':
      return applyTakeStarAction(state, action);
    case 'setup:take_ship':
      return applyTakeShipAction(state, action);
  }
};
