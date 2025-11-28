import { describe, expect, it } from 'vitest';

import { createMoveAction, createSetupAction } from '../action-builders';
import { GameEngine } from '../game-engine';
import { Color, Size } from '../types';

describe('Game Setup', () => {
  it('should start with correct initial state', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();
    expect(gameState.getPhase()).toBe('setup');
    expect(gameState.getCurrentPlayer()).toBe('player1');
    expect(gameState.getSystems().length).toBe(0);
    expect(gameState.getBankPieces().length).toBe(36);
    expect(gameState.getHomeSystem('player1')).toBeNull();
    expect(gameState.getHomeSystem('player2')).toBeNull();
  });

  it('after player1 selects first star, home system is assigned', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Action: player 1 selects a star
    engine.applyAction(createSetupAction('player1', 'p1-star1', 'star1'));

    const homeSystem = gameState.getHomeSystem('player1');
    // Home system should now be assigned with one star, no ships
    expect(homeSystem).not.toBeNull();
    expect(homeSystem!.stars.length).toBe(1);
    expect(homeSystem!.ships.length).toBe(0);

    // It should be present in systems
    const systems = gameState.getSystems();
    expect(systems.some(s => s.id === homeSystem!.id)).toBe(true);
  });

  it('should validate piece counts in bank', () => {
    const engine = new GameEngine();

    // Should have exactly 3 of each color-size combination
    const colors: Color[] = ['yellow', 'green', 'blue', 'red'];
    const sizes: Size[] = [1, 2, 3];

    for (const color of colors) {
      for (const size of sizes) {
        const pieces = engine
          .getGameState()
          .getBankPieces()
          .filter(p => p.color === color && p.size === size);
        expect(pieces.length).toBe(3);
      }
    }
  });

  it('should handle alternating setup sequence', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Alternating setup: P1 star1, P2 star1, P1 star2, P2 star2, P1 ship, P2 ship

    // Player 1 chooses first star (large blue)
    let result = engine.applyAction(
      createSetupAction('player1', 'p1-star1', 'star1')
    );
    expect(result.valid).toBe(true);
    expect(gameState.getCurrentPlayer()).toBe('player2');

    // Player 2 chooses first star (medium yellow)
    result = engine.applyAction(
      createSetupAction('player2', 'p2-star1', 'star1')
    );
    expect(result.valid).toBe(true);
    expect(gameState.getCurrentPlayer()).toBe('player1');

    // Player 1 chooses second star (small yellow)
    result = engine.applyAction(
      createSetupAction('player1', 'p1-star2', 'star2')
    );
    expect(result.valid).toBe(true);
    expect(gameState.getCurrentPlayer()).toBe('player2');

    // Player 2 chooses second star (small green)
    result = engine.applyAction(
      createSetupAction('player2', 'p2-star2', 'star2')
    );
    expect(result.valid).toBe(true);
    expect(gameState.getCurrentPlayer()).toBe('player1');

    // Player 1 chooses ship (large green)
    result = engine.applyAction(
      createSetupAction('player1', 'p1-ship', 'ship')
    );
    expect(result.valid).toBe(true);
    expect(gameState.getCurrentPlayer()).toBe('player2');

    // Player 2 chooses ship (large red)
    result = engine.applyAction(
      createSetupAction('player2', 'p2-ship', 'ship')
    );
    expect(result.valid).toBe(true);

    // Should now be in normal phase with player1's turn
    expect(gameState.getPhase()).toBe('normal');
    expect(gameState.getCurrentPlayer()).toBe('player1');

    // Verify both players have home systems
    const player1Home = gameState.getHomeSystem('player1');
    const player2Home = gameState.getHomeSystem('player2');

    expect(player1Home).toBeDefined();
    expect(player2Home).toBeDefined();
    expect(player1Home!.stars.length).toBe(2);
    expect(player1Home!.ships.length).toBe(1);
    expect(player2Home!.stars.length).toBe(2);
    expect(player2Home!.ships.length).toBe(1);
  });
});

describe('Setup Turn Enforcement', () => {
  it('should not allow player1 to take multiple actions in a row during setup', () => {
    const engine = new GameEngine();

    // Player 1: large green star
    let result = engine.applyAction(
      createSetupAction('player1', 'p1-star1', 'star1')
    );
    expect(result.valid).toBe(true);

    // Player 1 tries to take another setup action before player2
    result = engine.applyAction(
      createSetupAction('player1', 'p1-star2', 'star2')
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not your turn');
  });

  it('should not allow a player to take a normal action before setup is complete', () => {
    const engine = new GameEngine();

    // Player 1: large green star
    let result = engine.applyAction(
      createSetupAction('player1', 'p1-star1', 'star1')
    );
    expect(result.valid).toBe(true);

    // Player 2: large red star
    result = engine.applyAction(
      createSetupAction('player2', 'p2-star1', 'star1')
    );
    expect(result.valid).toBe(true);

    // Player 1 tries to move a ship
    result = engine.applyAction(
      createMoveAction('player1', 'p1-ship', 'p1-star1', 'system1')
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Move actions only allowed during normal play');
  });
});

describe('Setup Edge Cases', () => {
  it('should not allow players to select a missing bank piece', () => {
    // this scenario should be super unlikely in normal play, but it's possible
    // that while setting up their home worlds, players fully exhaust a certain
    // type of piece from the bank
    const engine = new GameEngine();

    // Player 1: large green star
    let result = engine.applyAction(
      createSetupAction('player1', 'p1-star1', 'star1')
    );
    expect(result.valid).toBe(true);

    // Player 2: large green star
    result = engine.applyAction(
      createSetupAction('player2', 'p2-star1', 'star1')
    );
    expect(result.valid).toBe(true);

    // Player 1: small green star
    result = engine.applyAction(
      createSetupAction('player1', 'p1-star2', 'star2')
    );
    expect(result.valid).toBe(true);

    // Player 2: small green star
    result = engine.applyAction(
      createSetupAction('player2', 'p2-star2', 'star2')
    );
    expect(result.valid).toBe(true);

    // Player 1: large green ship
    result = engine.applyAction(
      createSetupAction('player1', 'p1-ship', 'ship')
    );
    expect(result.valid).toBe(true); // this is ok... third piece of this type

    // Player 2: large green ship
    result = engine.applyAction(
      createSetupAction('player2', 'p2-ship', 'ship')
    );
    expect(result.valid).toBe(false); // not ok... no more large green pieces
  });
});
