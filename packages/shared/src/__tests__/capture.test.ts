import { describe, expect, it } from 'vitest';

import { createCaptureAction } from '../action-builders';
import { GameEngine } from '../game-engine';
import { createShip, createStar, createSystem } from '../utils';

describe('Capture Edge Cases', () => {
  it('should reject capturing own ship', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    const redStar = createStar('red', 1);
    const ship1 = createShip('yellow', 3, 'player1');
    const ship2 = createShip('blue', 2, 'player1');
    const system = createSystem([redStar], [ship1, ship2]);

    gameState.addSystem(system);
    gameState.setPhase('normal');

    const captureAction = createCaptureAction(
      'player1',
      ship1.id,
      ship2.id,
      system.id
    );
    const result = engine.applyAction(captureAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Cannot capture your own ship');
  });

  it('should reject capture when red not available', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    const blueStar = createStar('blue', 1);
    const playerShip = createShip('yellow', 3, 'player1');
    const enemyShip = createShip('green', 2, 'player2');
    const system = createSystem([blueStar], [playerShip, enemyShip]);

    gameState.addSystem(system);
    gameState.setPhase('normal');

    const captureAction = createCaptureAction(
      'player1',
      playerShip.id,
      enemyShip.id,
      system.id
    );
    const result = engine.applyAction(captureAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Red (capture) action not available');
  });
});
