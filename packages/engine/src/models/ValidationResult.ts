import { Color, Size } from './GamePiece';
import { Player } from './Player';
import { ValidationError } from './ValidationError';

/**
 * Validation result for actions. Uses a discriminated union pattern:
 * - `{ valid: true }` for valid actions
 * - `{ valid: false; error: ValidationError }` for invalid actions
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

export const valid = (): ValidationResult => ({ valid: true });
export const invalid = (error: ValidationError): ValidationResult => ({
  valid: false,
  error,
});

/**
 * Constructors to help create specific validation errors.
 */

/**
 * Invalid because the action is not for the current player.
 */
export const wrongPlayer = (err: {
  expected: Player;
  actual: Player;
}): ValidationResult => invalid({ type: 'wrong_player', ...err });

/**
 * Invalid because the action is not in the correct phase.
 */
export const wrongPhase = (err: {
  expected: 'setup' | 'normal';
  actual: 'setup' | 'normal';
}): ValidationResult => invalid({ type: 'wrong_phase', ...err });

/**
 * Invalid because the piece is not in the bank.
 */
export const pieceNotInBank = (color: Color, size: Size): ValidationResult =>
  invalid({ type: 'piece_not_in_bank', color, size });

/**
 * Invalid because the player's home system already has two stars.
 */
export const homeSystemAlreadyHasTwoStars = (
  player: Player
): ValidationResult =>
  invalid({ type: 'home_system_already_has_two_stars', player });

/**
 * Taking a ship is invalid if the player has not yet taken two stars.
 */
export const homeSystemNeedsTwoStars = (player: Player): ValidationResult =>
  invalid({ type: 'home_system_needs_two_stars', player });
