import { describe, expect, it } from 'vitest';

import { StarSystem } from '@binary-homeworlds/engine';

import {
  createMoveActionExisting,
  createMoveActionNew,
} from '../action-builders';
import { GameEngine } from '../game-engine';
import { createShip } from './utils';

describe('Movement Edge Cases', () => {
  it('should reject movement to system with same size stars', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Origin system with medium star
    const ship = createShip('yellow', 1, 'player1');
    const originSystem = StarSystem.createNormal(
      { color: 'blue', size: 2, id: 'blue-2-0' },
      [ship]
    );

    // Destination system with medium star (same size)
    const destSystem = StarSystem.createNormal(
      { color: 'red', size: 2, id: 'red-2-0' },
      []
    );

    gameState.setPhase('normal');
    gameState.addSystem(originSystem);
    gameState.addSystem(destSystem);

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
    const ship = createShip('yellow', 1, 'player1');
    const originSystem = StarSystem.createNormal(
      { color: 'blue', size: 2, id: 'blue-2-0' },
      [ship]
    );

    gameState.setPhase('normal');
    gameState.addSystem(originSystem);

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
    expect(gameState.getSystems().length).toBe(3);

    // The new system should contain the ship
    const systems = gameState.getSystems();
    expect(systems[0]?.ships.length).toBe(1);
    expect(systems[0]?.ships[0]?.id).toBe(ship.id);
  });

  it('should reject movement without available yellow', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // System with no yellow star and no yellow ships for player
    const blueShip = createShip('blue', 2, 'player1');
    const system = StarSystem.createNormal(
      { color: 'red', size: 1, id: 'red-1-0' },
      [blueShip]
    );

    const destSystem = StarSystem.createNormal(
      { color: 'green', size: 2, id: 'green-2-0' },
      []
    );

    gameState.setPhase('normal');
    gameState.addSystem(system);
    gameState.addSystem(destSystem);

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
