/**
 * Binary Homeworlds Game Engine
 * Main entry point for the game rules engine
 */

// Export all types
export * from './types.js';

// Export main classes
export { ActionValidator } from './action-validator.js';
export { GameEngine } from './game-engine.js';
export { BinaryHomeworldsGameState } from './game-state.js';

// Export utility functions
export * from './utils.js';

// Export action builders for convenience
export * from './action-builders.js';

// Export additional types for server compatibility
export {
  ActionType,
  ActionValidationResult,
  Bank,
  BaseAction,
  CaptureAction,
  Color,
  GameAction,
  GamePhase,
  GameResult,
  GameState,
  GrowAction,
  MoveAction,
  OverpopulationAction,
  Piece,
  Player,
  PlayerState,
  SacrificeAction,
  SetupAction,
  Ship,
  Star,
  System,
  TradeAction,
} from './types.js';
