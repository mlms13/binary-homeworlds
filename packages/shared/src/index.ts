/**
 * Binary Homeworlds Game Engine
 * Main entry point for the game rules engine
 */

// Export all types
export * from './types';

// Export main classes
export { ActionValidator } from './action-validator';
export { GameEngine } from './game-engine';
export { BinaryHomeworldsGameState } from './game-state';

// Export utility functions
export * from './utils';

// Export action builders for convenience
export * from './action-builders';

// Export additional types for server compatibility
export {
  ActionType,
  ActionValidationResult,
  BaseAction,
  CaptureAction,
  GameAction,
  GamePhase,
  GameResult,
  GameState,
  GrowAction,
  MoveAction,
  OverpopulationAction,
  PlayerState,
  SacrificeAction,
  SetupAction,
  TradeAction,
} from './types';
