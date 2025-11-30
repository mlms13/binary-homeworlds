import { describe, expect, it } from 'vitest';

import { StarSystem } from '@binary-homeworlds/engine';

import {
  createCaptureAction,
  createOverpopulationAction,
  createSacrificeAction,
} from '../action-builders';
import { GameEngine } from '../game-engine';
import { createShip } from './utils';

describe('Game End Conditions', () => {
  it('should end game when player has no ships at home', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Set up home systems
    const player1Ship = createShip('yellow', 1, 'player1');
    const player1Home = StarSystem.createBinary(
      'player1',
      { color: 'blue', size: 2, id: 'blue-2-0' },
      { color: 'red', size: 3, id: 'red-3-0' },
      [player1Ship]
    );

    const player2Ship = createShip('green', 2, 'player2');
    const yellow1 = { color: 'yellow', size: 1, id: 'yellow-1-0' } as const;
    const blue1 = { color: 'blue', size: 1, id: 'blue-1-0' } as const;
    const player2Home = StarSystem.createBinary('player2', yellow1, blue1, [
      player2Ship,
    ]);

    gameState.addSystem(player1Home);
    gameState.addSystem(player2Home);
    gameState.setHomeSystem('player1', player1Home.id);
    gameState.setHomeSystem('player2', player2Home.id);
    gameState.setPhase('normal');

    // Player 2 captures player 1's ship at home
    const captureAction = createCaptureAction(
      'player2',
      player2Ship.id,
      player1Ship.id,
      player1Home.id
    );

    // First move player 2's ship to player 1's home
    player1Home.ships.push(player2Ship);
    player2Home.ships = [];

    // Make sure it's player2's turn
    if (gameState.getCurrentPlayer() !== 'player2') {
      gameState.switchPlayer();
    }

    const result = engine.applyAction(captureAction);
    expect(result.valid).toBe(true);

    // Game should end with player 2 winning
    expect(gameState.isGameEnded()).toBe(true);
    expect(gameState.getWinner()).toBe('player2');
  });

  it('should end game when home stars are destroyed', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Set up home system with overpopulation potential
    const player1Home = StarSystem.createBinary(
      'player1',
      { color: 'red', size: 1, id: 'red-1-0' },
      { color: 'red', size: 2, id: 'red-2-0' },
      [createShip('red', 1, 'player1'), createShip('red', 2, 'player1')]
    );

    const player2Home = StarSystem.createBinary(
      'player2',
      { color: 'blue', size: 1, id: 'blue-1-0' },
      { color: 'green', size: 2, id: 'green-2-0' },
      [createShip('yellow', 1, 'player2')]
    );

    gameState.addSystem(player1Home);
    gameState.addSystem(player2Home);
    gameState.setHomeSystem('player1', player1Home.id);
    gameState.setHomeSystem('player2', player2Home.id);
    gameState.setPhase('normal');

    // Make sure it's player2's turn
    if (gameState.getCurrentPlayer() !== 'player2') {
      gameState.switchPlayer();
    }

    // Declare overpopulation on red (4 red pieces: 2 stars + 2 ships)
    const overpopAction = createOverpopulationAction(
      'player2',
      player1Home.id,
      'red'
    );
    const result = engine.applyAction(overpopAction);

    expect(result.valid).toBe(true);
    expect(gameState.isGameEnded()).toBe(true);
    expect(gameState.getWinner()).toBe('player2');
  });

  it('should end game when player sacrifices last ship at home', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Set up player1 with only one ship at home
    const player1Ship = createShip('yellow', 2, 'player1');
    const player1Home = StarSystem.createBinary(
      'player1',
      { color: 'blue', size: 1, id: 'blue-1-0' },
      { color: 'green', size: 2, id: 'green-2-0' },
      [player1Ship]
    );

    // Set up player2 with normal home
    const player2Home = StarSystem.createBinary(
      'player2',
      { color: 'red', size: 1, id: 'red-1-0' },
      { color: 'yellow', size: 3, id: 'yellow-3-0' },
      [createShip('red', 1, 'player2')]
    );

    gameState.addSystem(player1Home);
    gameState.addSystem(player2Home);
    gameState.setHomeSystem('player1', player1Home.id);
    gameState.setHomeSystem('player2', player2Home.id);
    gameState.setPhase('normal');

    // Make sure it's player1's turn
    if (gameState.getCurrentPlayer() !== 'player1') {
      gameState.switchPlayer();
    }

    // Player1 sacrifices their only ship at home
    const sacrificeAction = createSacrificeAction(
      'player1',
      player1Ship.id,
      player1Home.id,
      [] // No followup actions needed for this test
    );

    const result = engine.applyAction(sacrificeAction);

    // The sacrifice should be valid but game should end immediately
    expect(result.valid).toBe(true);
    expect(gameState.isGameEnded()).toBe(true);
    expect(gameState.getWinner()).toBe('player2');
  });
});
