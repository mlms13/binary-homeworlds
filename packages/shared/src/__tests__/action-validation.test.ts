import { describe, expect, it } from 'vitest';

import { GamePiece, StarSystem } from '@binary-homeworlds/engine';

import { createMoveAction, createSetupAction } from '../action-builders';
import { GameEngine } from '../game-engine';
import { createShip, createStar } from './utils';

describe('Action Validation', () => {
  it('should reject actions from wrong player', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Set up a basic game state
    const ship = createShip('yellow', 1, 'player1');
    const star = createStar('blue', 2);
    const system = StarSystem.createNormal(star, [ship]);
    gameState.addSystem(system);
    gameState.setPhase('normal');
    // Current player is player1

    // Player 2 tries to move player 1's ship
    const moveAction = createMoveAction('player2', ship.id, system.id);
    const result = engine.applyAction(moveAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Not your turn');
  });

  it('should reject actions after game ends', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Set up and end the game
    gameState.setPhase('ended');
    gameState.setWinner('player1');

    const ship = createShip('yellow', 1, 'player2');
    const star = createStar('blue', 2);
    const system = StarSystem.createNormal(star, [ship]);
    gameState.addSystem(system);

    const moveAction = createMoveAction('player2', ship.id, system.id);
    const result = engine.applyAction(moveAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Game has ended');
  });

  it('should reject setup actions during normal play', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    gameState.setPhase('normal');
    const bankPieces = gameState.getBankPieces();

    const setupAction = createSetupAction(
      'player1',
      bankPieces[0]?.id ?? ('yellow-1-0' as GamePiece.PieceId),
      'star1'
    );
    const result = engine.applyAction(setupAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain(
      'Setup actions only allowed during setup phase'
    );
  });

  it('should reject normal actions during setup', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Game starts in setup phase
    const ship = createShip('yellow', 1, 'player1');
    const star = createStar('blue', 2);
    const system = StarSystem.createNormal(star, [ship]);
    gameState.addSystem(system);

    const moveAction = createMoveAction('player1', ship.id, system.id);
    const result = engine.applyAction(moveAction);

    expect(result.valid).toBe(false);
    expect(result.error).toContain(
      'Move actions only allowed during normal play'
    );
  });
});
