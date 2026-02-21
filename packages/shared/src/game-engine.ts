/**
 * Main game engine for Binary Homeworlds
 */

import { StarSystem } from '@binary-homeworlds/engine';

import { ActionValidator } from './action-validator';
import { BinaryHomeworldsGameState } from './game-state';
import { ActionType, ActionValidationResult, GameAction } from './types';

export class GameEngine {
  private gameState: BinaryHomeworldsGameState;

  constructor(gameState?: BinaryHomeworldsGameState) {
    this.gameState = gameState || new BinaryHomeworldsGameState();
  }

  // Get current game state
  getGameState(): BinaryHomeworldsGameState {
    return this.gameState;
  }

  // Apply an action to the game state
  applyAction(action: GameAction): ActionValidationResult {
    // Validate the action
    const validation = ActionValidator.validate(
      action,
      this.gameState.getState()
    );
    if (!validation.valid) {
      return validation;
    }

    // Apply the action
    try {
      this.gameState.applyAction(action);
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check for game end conditions (only during normal play)
    const state = this.gameState.getState();
    if (state.tag === 'normal') {
      this.gameState.checkAndUpdateGameEnd();
    }

    return { valid: true };
  }

  // Replay a sequence of actions to reconstruct game state
  static fromHistory(actions: Array<GameAction>): GameEngine {
    const engine = new GameEngine();

    for (const action of actions) {
      const result = engine.applyAction(action);
      if (!result.valid) {
        throw new Error(`Failed to replay action: ${result.error}`);
      }
    }

    return engine;
  }

  // Get available actions for current player
  getAvailableActions(): Array<string> {
    const phase = this.gameState.getPhase();
    const actions: Array<ActionType> = [];

    if (phase === 'setup') {
      actions.push('setup:take_star', 'setup:take_ship');
    } else if (phase === 'normal') {
      actions.push('move', 'capture', 'grow', 'trade', 'sacrifice');
    }

    // Overpopulation can always be declared if condition exists
    for (const system of this.gameState.getSystems()) {
      const overpopulations = StarSystem.getOverpopulations(system);
      if (overpopulations.length > 0) {
        actions.push('overpopulation');
        break;
      }
    }

    return Array.from(new Set(actions)); // Remove duplicates
  }
}
