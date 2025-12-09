import * as Bank from '../models/Bank';
import * as Game from '../models/Game';
import { Color, Size } from '../models/GamePiece';
import { Player } from '../models/Player';
import * as StarSystem from '../models/StarSystem';
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
export const validateSetupAction = (
  state: Game.GameState,
  action: SetupAction
): ValidationResult.ValidationResult => {
  // Check that we're in the appropriate phase
  if (state.tag !== 'setup') {
    return ValidationResult.wrongPhase({
      expected: 'setup',
      actual: state.tag,
    });
  }

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
  const playerHomeSystem = Game.getHomeSystem(action.player, state);
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
  state: Game.GameState,
  { color, size, player }: TakeStarAction
): Game.GameState => {
  const playerHomeSystem = Game.getHomeSystem(player, state);
  const [piece, bank] = Bank.takePieceBySizeAndColor(size, color, state.bank);

  // We don't validate actions here. If the piece isn't in the bank, we expect
  // the caller of this function to have already caught that in validation, so
  // we just return the unchanged state.
  if (!piece) {
    return state;
  }

  const newHomeSystem = StarSystem.addStar(piece, playerHomeSystem);

  return {
    ...Game.switchActivePlayer(state),
    bank,
    homeSystems: { ...state.homeSystems, [player]: newHomeSystem },
  };
};

const applyTakeShipAction = (
  state: Game.GameState,
  { color, size, player }: TakeShipAction
): Game.GameState => {
  const playerHomeSystem = Game.getHomeSystem(player, state);
  const [piece, bank] = Bank.takePieceBySizeAndColor(size, color, state.bank);

  // We don't validate actions here. If the piece isn't in the bank, we expect
  // the caller of this function to have already caught that in validation, so
  // we just return the unchanged state.
  if (!piece) {
    return state;
  }

  const ship = { ...piece, owner: player };
  const newHomeSystem = StarSystem.addShip(ship, playerHomeSystem);

  const nextState = {
    ...Game.switchActivePlayer(state),
    bank,
    homeSystems: { ...state.homeSystems, [player]: newHomeSystem },
  };

  // if both home systems are valid (particularly if they each have a ship),
  // the setup phase is over and we switch to the normal phase.
  const allHomeSystemsValid =
    StarSystem.validate(nextState.homeSystems.player1).valid &&
    StarSystem.validate(nextState.homeSystems.player2).valid;

  if (!allHomeSystemsValid) {
    return nextState;
  }

  return {
    ...nextState,
    tag: 'normal',
    systems: [],
    winner: undefined,
  };
};

export const apply = (
  state: Game.GameState,
  action: SetupAction
): Game.GameState => {
  switch (action.type) {
    case 'setup:take_star':
      return applyTakeStarAction(state, action);
    case 'setup:take_ship':
      return applyTakeShipAction(state, action);
  }
};
