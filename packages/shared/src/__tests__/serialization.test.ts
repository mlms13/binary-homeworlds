import { describe, expect, it } from 'vitest';

import { StarSystem } from '@binary-homeworlds/engine';

import { createMoveAction } from '../action-builders';
import { GameEngine } from '../game-engine';
import { BinaryHomeworldsGameState } from '../game-state';
import { createShip } from './utils';

describe('Serialization and History', () => {
  it('should serialize and deserialize game state correctly', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Make some changes to the state
    const ship = createShip('yellow', 1, 'player1');
    const system = StarSystem.createNormal(
      { color: 'blue', size: 2, id: 'blue-2-0' },
      [ship]
    );
    gameState.addSystem(system);
    gameState.setPhase('normal');

    // Serialize
    const serialized = gameState.serialize();

    // Deserialize
    const newGameState = BinaryHomeworldsGameState.deserialize(serialized);

    // Should be identical
    expect(newGameState.getPhase()).toBe('normal');
    expect(newGameState.getSystems().length).toBe(1);
    expect(newGameState.getSystems()[0]?.ships.length).toBe(1);
    expect(newGameState.getSystems()[0]?.stars.length).toBe(1);
  });

  it('should maintain action history', () => {
    const engine = new GameEngine();
    const gameState = engine.getGameState();

    // Set up a simple scenario
    const ship = createShip('yellow', 1, 'player1');
    const system = StarSystem.createNormal(
      { color: 'blue', size: 2, id: 'blue-2-0' },
      [ship]
    );
    gameState.addSystem(system);
    gameState.setPhase('normal');

    const bankPieces = gameState.getBankPieces();
    const newStarPiece = bankPieces.find(p => p.size === 1);

    // Apply an action
    const moveAction = createMoveAction(
      'player1',
      ship.id,
      system.id,
      undefined,
      newStarPiece!.id
    );

    engine.applyAction(moveAction);

    // Check history
    const history = gameState.getHistory();
    expect(history.length).toBe(1);
    expect(history[0]?.type).toBe('move');
    expect(history[0]?.player).toBe('player1');
  });
});
