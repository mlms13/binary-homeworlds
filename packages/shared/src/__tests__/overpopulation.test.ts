import { describe, expect, it } from 'vitest';

import { Player } from '@binary-homeworlds/engine';

import {
  createGrowAction,
  createMoveAction,
  createOverpopulationAction,
  createSetupAction,
} from '../action-builders';
import { GameEngine } from '../game-engine';

describe('Overpopulation', () => {
  const initialActions = [
    // setup: each player takes blue/green small stars and a small yellow ship
    createSetupAction('player1', 'green', 1, 'star1'),
    createSetupAction('player2', 'green', 1, 'star1'),
    createSetupAction('player1', 'blue', 1, 'star2'),
    createSetupAction('player2', 'blue', 1, 'star2'),
    createSetupAction('player1', 'yellow', 1, 'ship'),
    createSetupAction('player2', 'yellow', 1, 'ship'),

    // in turn order, each player grows 2 more small yellow ships at home
    createGrowAction('player1', 'yellow-1-0', 'player1-home', 'yellow-1-2'),
    createGrowAction('player2', 'yellow-1-1', 'player2-home', 'yellow-2-0'),
    createGrowAction('player1', 'yellow-1-0', 'player1-home', 'yellow-2-1'),
    createGrowAction('player2', 'yellow-1-1', 'player2-home', 'yellow-2-2'),

    // then, player 1 moves to a new large yellow star system
    createMoveAction(
      'player1',
      'yellow-1-2',
      'player1-home',
      undefined,
      'yellow-3-0'
    ),

    // and player 2 follows, leading to 3 yellow pieces at that system
    createMoveAction('player2', 'yellow-2-0', 'player2-home', 'yellow-3-0'),
  ];

  it('detects blue overpopulation after growing at a blue star', () => {
    // Setup: home system with green star, red star, and blue ship
    const engine = new GameEngine();
    const gameState = engine.getGameState();
    // Player 1 setup
    engine.applyAction(createSetupAction('player1', 'green', 3, 'star1'));
    engine.applyAction(createSetupAction('player2', 'green', 2, 'star1'));
    engine.applyAction(createSetupAction('player1', 'blue', 1, 'star2'));
    engine.applyAction(createSetupAction('player2', 'blue', 1, 'star2'));
    engine.applyAction(createSetupAction('player1', 'blue', 3, 'ship'));
    engine.applyAction(createSetupAction('player2', 'blue', 3, 'ship'));

    // Now there should be 2 blue ships and 2 blue stars (4 blue pieces)
    const player1Home = gameState.getHomeSystem('player1')!;
    const blueCount =
      player1Home.ships.filter(s => s.color === 'blue').length +
      player1Home.stars.filter(s => s.color === 'blue').length;
    expect(blueCount).toBeLessThan(4);
    // Overpopulation should NOT be detected
    expect(gameState.getOverpopulations()).toHaveLength(0);

    // Player 1 grows a blue ship (still no overpopulation)
    engine.applyAction(
      createGrowAction('player1', 'blue-3-0', 'player1-home', 'blue-1-2')
    );
    expect(gameState.getHomeSystem('player1')?.ships.length).toBe(2);
    expect(gameState.getOverpopulations()).toHaveLength(0);

    // Player 2 grows a blue ship (no overpopulation)
    engine.applyAction(
      createGrowAction('player2', 'blue-3-1', 'player2-home', 'blue-2-0')
    );
    expect(gameState.getOverpopulations()).toHaveLength(0);

    // Player 1 grows another blue ship (3 total blue ships, 1 star piece)
    engine.applyAction(
      createGrowAction('player1', 'blue-3-0', 'player1-home', 'blue-2-1')
    );

    expect(gameState.getHomeSystem('player1')?.ships.length).toBe(3);
    expect(gameState.getOverpopulations()).toHaveLength(1);
  });

  it('detects overpopulation with ships from both players', () => {
    const engine = GameEngine.fromHistory(initialActions);
    const gameState = engine.getGameState();

    // At this point there's a yellow-3 star that both players can reach in a
    // single move. Each player has moved a yellow ship there, and each player
    // has additional yellow ships at home.

    // Initially, there is no overpopulation
    expect(gameState.getOverpopulations()).toHaveLength(0);

    // Player 1 moves a second ship (a third total ship) to the yellow star,
    // which creates overpopulation
    engine.applyAction(
      createMoveAction('player1', 'yellow-2-1', 'player1-home', 'yellow-3-0')
    );

    expect(gameState.getOverpopulations()).toHaveLength(1);
    expect(gameState.getOverpopulations()[0]!.color).toBe('yellow');
  });

  it('allows the active player to declare overpopulation', () => {
    const engine = GameEngine.fromHistory(initialActions);
    engine.applyAction(
      createMoveAction('player1', 'yellow-2-1', 'player1-home', 'yellow-3-0')
    );

    const activePlayer = engine.getGameState().getCurrentPlayer();
    engine.applyAction(
      createOverpopulationAction(activePlayer, 'yellow-3-0', 'yellow')
    );
    expect(engine.getGameState().getSystems()).toHaveLength(2); // only homeworlds
  });

  it.skip('allows the inactive player to declare overpopulation', () => {
    const engine = GameEngine.fromHistory(initialActions);
    engine.applyAction(
      createMoveAction('player1', 'yellow-2-1', 'player1-home', 'yellow-3-0')
    );

    const inactivePlayer = Player.getOtherPlayer(
      engine.getGameState().getCurrentPlayer()
    );

    const result = engine.applyAction(
      createOverpopulationAction(inactivePlayer, 'yellow-3-0', 'yellow')
    );

    expect(result.error).not.toBeDefined();
    expect(engine.getGameState().getSystems()).toHaveLength(2); // only homeworlds
  });

  it('clears overpopulation if a player moves a ship away', () => {
    const engine = GameEngine.fromHistory(initialActions);
    const gameState = engine.getGameState();
    engine.applyAction(
      createMoveAction('player1', 'yellow-2-1', 'player1-home', 'yellow-3-0')
    );

    expect(gameState.getOverpopulations()).toHaveLength(1);
    expect(gameState.getSystem('yellow-3-0')!.ships).toHaveLength(3);

    // but if neither player declares it and player 2 moves a ship away
    // the system still exists and overpopulation is gone
    engine.applyAction(
      createMoveAction('player2', 'yellow-2-0', 'yellow-3-0', 'player2-home')
    );

    expect(gameState.getOverpopulations()).toHaveLength(0);
    expect(gameState.getSystem('yellow-3-0')!.ships).toHaveLength(2);
  });
});
