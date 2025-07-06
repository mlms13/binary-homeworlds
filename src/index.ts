/**
 * Binary Homeworlds Game Engine
 * Main entry point for the game rules engine
 */

// Export all types
export * from './types';

// Export main classes
export { BinaryHomeworldsGameState } from './game-state';
export { GameEngine } from './game-engine';
export { ActionValidator } from './action-validator';

// Export utility functions
export * from './utils';

// Export action builders for convenience
export * from './action-builders';
