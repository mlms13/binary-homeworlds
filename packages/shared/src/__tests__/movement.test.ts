import { describe, expect, it } from 'vitest';

import {
  createMoveActionExisting,
  createMoveActionNew,
} from '../action-builders';
import { GameEngine } from '../game-engine';
import { createSystem } from '../utils';
import { createShip, createStar } from './utils';

describe('Movement Edge Cases', () => {
  it('should reject movement to system with same size stars', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Origin system with medium star
    const originStar = createStar('blue', 2);
    const ship = createShip('yellow', 1, 'player1');
    const originSystem = createSystem([originStar], [ship]);

    // Destination system with medium star (same size)
    const destStar = createStar('red', 2);
    const destSystem = createSystem([destStar]);

    gameState.addSystem(originSystem);
    gameState.addSystem(destSystem);
    gameState.setPhase('normal');

    const moveAction = createMoveActionExisting(
      'player1',
      ship.id,
      originSystem.id,
      destSystem.id
    );
    const result = engine.applyAction(moveAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('different sizes');
  });

  it('should allow movement to new system with different size star', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Origin system with medium star
    const originStar = createStar('blue', 2);
    const ship = createShip('yellow', 1, 'player1');
    const originSystem = createSystem([originStar], [ship]);

    gameState.addSystem(originSystem);
    gameState.setPhase('normal');

    const bankPieces = gameState.getBankPieces();
    const newStarPiece = bankPieces.find(p => p.size === 1);

    const moveAction = createMoveActionNew(
      'player1',
      ship.id,
      originSystem.id,
      newStarPiece!.id
    );

    const result = engine.applyAction(moveAction);
    expect(result.valid).toBe(true);

    // Should create new system, but original system should be cleaned up (no ships left)
    expect(gameState.getSystems().length).toBe(1);

    // The new system should contain the ship
    const systems = gameState.getSystems();
    expect(systems[0]?.ships.length).toBe(1);
    expect(systems[0]?.ships[0]?.id).toBe(ship.id);
  });

  it('should reject movement without available yellow', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // System with no yellow star and no yellow ships for player
    const redStar = createStar('red', 1);
    const blueShip = createShip('blue', 2, 'player1');
    const system = createSystem([redStar], [blueShip]);

    const destStar = createStar('green', 2);
    const destSystem = createSystem([destStar]);

    gameState.addSystem(system);
    gameState.addSystem(destSystem);
    gameState.setPhase('normal');

    const moveAction = createMoveActionExisting(
      'player1',
      blueShip.id,
      system.id,
      destSystem.id
    );
    const result = engine.applyAction(moveAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Yellow (move) action not available');
  });
});
