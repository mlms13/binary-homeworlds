import { describe, expect, it } from 'vitest';

import { createTradeAction } from '../action-builders';
import { GameEngine } from '../game-engine';
import { createSystem } from '../utils';
import { createShip, createStar } from './utils';

describe('Trade Edge Cases', () => {
  it('should reject trade when blue not available', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    const redStar = createStar('red', 1);
    const yellowShip = createShip('yellow', 2, 'player1');
    const system = createSystem([redStar], [yellowShip]);

    gameState.addSystem(system);
    gameState.setPhase('normal');

    const bankPieces = gameState.getBankPieces();
    const greenPiece = bankPieces.find(
      p => p.color === 'green' && p.size === 2
    );

    const tradeAction = createTradeAction(
      'player1',
      yellowShip.id,
      system.id,
      greenPiece!.id
    );
    const result = engine.applyAction(tradeAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Blue (trade) action not available');
  });

  it('should reject trade with different size piece', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    const blueStar = createStar('blue', 1);
    const yellowShip = createShip('yellow', 2, 'player1');
    const system = createSystem([blueStar], [yellowShip]);

    gameState.addSystem(system);
    gameState.setPhase('normal');

    const bankPieces = gameState.getBankPieces();
    const greenPiece = bankPieces.find(
      p => p.color === 'green' && p.size === 1
    ); // Different size

    const tradeAction = createTradeAction(
      'player1',
      yellowShip.id,
      system.id,
      greenPiece!.id
    );
    const result = engine.applyAction(tradeAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('same size');
  });

  it('should reject trade for same color', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    const blueStar = createStar('blue', 1);
    const yellowShip = createShip('yellow', 2, 'player1');
    const system = createSystem([blueStar], [yellowShip]);

    gameState.addSystem(system);
    gameState.setPhase('normal');

    const bankPieces = gameState.getBankPieces();
    const yellowPiece = bankPieces.find(
      p => p.color === 'yellow' && p.size === 2
    ); // Same color

    const tradeAction = createTradeAction(
      'player1',
      yellowShip.id,
      system.id,
      yellowPiece!.id
    );
    const result = engine.applyAction(tradeAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('different color');
  });
});
