import { describe, expect, it } from 'vitest';

import { StarSystem } from '@binary-homeworlds/engine';

import { createGrowAction } from '../action-builders';
import { GameEngine } from '../game-engine';
import { createShip } from './utils';

describe('Growth Edge Cases', () => {
  it('should reject growth when green not available', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    const blueShip = createShip('blue', 2, 'player1');
    const system = StarSystem.createNormal(
      { color: 'red', size: 1, id: 'red-1-0' },
      [blueShip]
    );

    gameState.setPhase('normal');
    gameState.addSystem(system);

    const bankPieces = gameState.getBankPieces();
    const bluePiece = bankPieces.find(p => p.color === 'blue' && p.size === 1);

    const growAction = createGrowAction(
      'player1',
      blueShip.id,
      system.id,
      bluePiece!.id
    );
    const result = engine.applyAction(growAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Green (grow) action not available');
  });

  it('should reject growth with wrong color piece', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    const redShip = createShip('red', 2, 'player1');
    const system = StarSystem.createNormal(
      { color: 'green', size: 1, id: 'green-1-0' },
      [redShip]
    );

    gameState.setPhase('normal');
    gameState.addSystem(system);

    const bankPieces = gameState.getBankPieces();
    const bluePiece = bankPieces.find(p => p.color === 'blue' && p.size === 1);

    const growAction = createGrowAction(
      'player1',
      redShip.id,
      system.id,
      bluePiece!.id
    );
    const result = engine.applyAction(growAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('same color as acting ship');
  });
});
