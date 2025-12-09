import { Color, Size } from './GamePiece';
import { Player } from './Player';

/**
 * Typed validation errors for action validation.
 * Each error type is a discriminated union member, allowing pattern matching
 * on the error type and accessing type-specific fields.
 */
export type ValidationError =
  | { type: 'game_ended' }
  | { type: 'wrong_player'; expected: Player; actual: Player }
  | {
      type: 'wrong_phase';
      expected: 'setup' | 'normal';
      actual: 'setup' | 'normal';
    }
  | { type: 'piece_not_in_bank'; color: Color; size: Size }
  | { type: 'home_system_already_has_two_stars'; player: Player }
  | { type: 'home_system_needs_two_stars'; player: Player };
