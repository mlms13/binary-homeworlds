/**
 * Edge case tests for Binary Homeworlds game engine
 */

import { describe, expect, it } from 'vitest';

import { GamePiece } from '@binary-homeworlds/engine';

import {
  createCaptureAction,
  createGrowAction,
  createMoveAction,
  createOverpopulationAction,
  createSacrificeAction,
  createSetupAction,
  createTradeAction,
} from '../action-builders';
import { GameEngine } from '../game-engine';
import { BinaryHomeworldsGameState } from '../game-state';
import { createSystem } from '../utils';
import { createShip, createStar } from './utils';

describe('Edge Cases and Error Conditions', () => {
  describe('Game Setup', () => {
    it('should start with correct initial state', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();
      const state = gameState.getState();

      expect(state.phase).toBe('setup');
      expect(state.currentPlayer).toBe('player1');
      expect(state.turnNumber).toBe(1);
      expect(state.systems.length).toBe(0);
      expect(gameState.getBankPieces().length).toBe(36); // 4 colors × 3 sizes × 3 pieces
      expect(state.winner).toBeUndefined();
    });

    it('should validate piece counts in bank', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();
      const bankPieces = gameState.getBankPieces();

      // Count pieces by color and size
      const counts: Record<string, number> = {};
      for (const piece of bankPieces) {
        const key = `${piece.color}-${piece.size}`;
        counts[key] = (counts[key] || 0) + 1;
      }

      // Should have exactly 3 of each color-size combination
      const colors: Array<GamePiece.Color> = ['yellow', 'green', 'blue', 'red'];
      const sizes: Array<GamePiece.Size> = [1, 2, 3];

      for (const color of colors) {
        for (const size of sizes) {
          const key = `${color}-${size}`;
          expect(counts[key]).toBe(3);
        }
      }
    });

    it('should handle complete setup sequence (legacy test)', () => {
      // This test verifies the old behavior still works for backward compatibility
      // but the new alternating setup is the preferred method
      const engine = new GameEngine();
      const gameState = engine.getGameState();
      const bankPieces = gameState.getBankPieces();

      // Player 1 setup (all at once)
      let result = engine.applyAction(
        createSetupAction(
          'player1',
          bankPieces[0]?.id ?? ('yellow-1-0' as GamePiece.PieceId),
          'star1'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player2'); // Now switches after each action

      result = engine.applyAction(
        createSetupAction(
          'player2',
          bankPieces[1]?.id ?? ('yellow-1-1' as GamePiece.PieceId),
          'star1'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player1');

      result = engine.applyAction(
        createSetupAction(
          'player1',
          bankPieces[2]?.id ?? ('yellow-1-2' as GamePiece.PieceId),
          'star2'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player2');

      result = engine.applyAction(
        createSetupAction(
          'player2',
          bankPieces[3]?.id ?? ('yellow-2-0' as GamePiece.PieceId),
          'star2'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player1');

      result = engine.applyAction(
        createSetupAction(
          'player1',
          bankPieces[4]?.id ?? ('yellow-2-1' as GamePiece.PieceId),
          'ship'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player2');

      result = engine.applyAction(
        createSetupAction(
          'player2',
          bankPieces[5]?.id ?? ('yellow-2-2' as GamePiece.PieceId),
          'ship'
        )
      );
      expect(result.valid).toBe(true);

      // Should now be in normal phase with player1's turn
      expect(gameState.getPhase()).toBe('normal');
      expect(gameState.getCurrentPlayer()).toBe('player1');
      expect(gameState.getSystems().length).toBe(2);
    });

    it('should handle alternating setup sequence', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();
      const bankPieces = gameState.getBankPieces();

      // Alternating setup: P1 star1, P2 star1, P1 star2, P2 star2, P1 ship, P2 ship

      // Player 1 chooses first star
      let result = engine.applyAction(
        createSetupAction(
          'player1',
          bankPieces[0]?.id ?? ('yellow-1-0' as GamePiece.PieceId),
          'star1'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player2');

      // Player 2 chooses first star
      result = engine.applyAction(
        createSetupAction(
          'player2',
          bankPieces[1]?.id ?? ('yellow-1-1' as GamePiece.PieceId),
          'star1'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player1');

      // Player 1 chooses second star
      result = engine.applyAction(
        createSetupAction(
          'player1',
          bankPieces[2]?.id ?? ('yellow-1-2' as GamePiece.PieceId),
          'star2'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player2');

      // Player 2 chooses second star
      result = engine.applyAction(
        createSetupAction(
          'player2',
          bankPieces[3]?.id ?? ('yellow-2-0' as GamePiece.PieceId),
          'star2'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player1');

      // Player 1 chooses ship
      result = engine.applyAction(
        createSetupAction(
          'player1',
          bankPieces[4]?.id ?? ('yellow-2-1' as GamePiece.PieceId),
          'ship'
        )
      );
      expect(result.valid).toBe(true);
      expect(gameState.getCurrentPlayer()).toBe('player2');

      // Player 2 chooses ship
      result = engine.applyAction(
        createSetupAction(
          'player2',
          bankPieces[5]?.id ?? ('yellow-2-2' as GamePiece.PieceId),
          'ship'
        )
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

  describe('Action Validation', () => {
    it('should reject actions from wrong player', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Set up a basic game state
      const ship = createShip('yellow', 1, 'player1');
      const star = createStar('blue', 2);
      const system = createSystem([star], [ship]);
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
      const system = createSystem([star], [ship]);
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
      const system = createSystem([star], [ship]);
      gameState.addSystem(system);

      const moveAction = createMoveAction('player1', ship.id, system.id);
      const result = engine.applyAction(moveAction);

      expect(result.valid).toBe(false);
      expect(result.error).toContain(
        'Move actions only allowed during normal play'
      );
    });
  });

  describe('Game End Conditions', () => {
    it('should end game when player has no ships at home', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Set up home systems
      const player1Ship = createShip('yellow', 1, 'player1');
      const player1Star1 = createStar('blue', 2);
      const player1Star2 = createStar('red', 3);
      const player1Home = createSystem(
        [player1Star1, player1Star2],
        [player1Ship]
      );

      const player2Ship = createShip('green', 2, 'player2');
      const player2Star1 = createStar('yellow', 1);
      const player2Star2 = createStar('blue', 1);
      const player2Home = createSystem(
        [player2Star1, player2Star2],
        [player2Ship]
      );

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
      const redStar1 = createStar('red', 1);
      const redStar2 = createStar('red', 2);
      const redShip1 = createShip('red', 1, 'player1');
      const redShip2 = createShip('red', 2, 'player1');
      const player1Home = createSystem(
        [redStar1, redStar2],
        [redShip1, redShip2]
      );

      const player2Home = createSystem(
        [createStar('blue', 1), createStar('green', 2)],
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
      const player1Home = createSystem(
        [createStar('blue', 1), createStar('green', 2)],
        [player1Ship]
      );

      // Set up player2 with normal home
      const player2Home = createSystem(
        [createStar('red', 1), createStar('yellow', 3)],
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

      const moveAction = createMoveAction(
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

      // Get a piece from bank for new star
      const bankPieces = gameState.getBankPieces();
      const newStarPiece = bankPieces.find(p => p.size === 1); // Different size

      const moveAction = createMoveAction(
        'player1',
        ship.id,
        originSystem.id,
        undefined,
        newStarPiece!.id
      );

      const result = engine.applyAction(moveAction);
      expect(result.valid).toBe(true);

      // Should create new system, but original system should be cleaned up (no ships left)
      expect(gameState.getSystems().length).toBe(1);

      // The new system should contain the ship
      const systems = gameState.getSystems();
      expect(systems[0]?.ships.length).toBe(1);
      expect(systems[0]?.ships[0]?.id).toBe(ship.id ?? '');
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

      const moveAction = createMoveAction(
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

  describe('Growth Edge Cases', () => {
    it('should reject growth when green not available', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      const redStar = createStar('red', 1);
      const blueShip = createShip('blue', 2, 'player1');
      const system = createSystem([redStar], [blueShip]);

      gameState.addSystem(system);
      gameState.setPhase('normal');

      const bankPieces = gameState.getBankPieces();
      const bluePiece = bankPieces.find(
        p => p.color === 'blue' && p.size === 1
      );

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

      const greenStar = createStar('green', 1);
      const redShip = createShip('red', 2, 'player1');
      const system = createSystem([greenStar], [redShip]);

      gameState.addSystem(system);
      gameState.setPhase('normal');

      const bankPieces = gameState.getBankPieces();
      const bluePiece = bankPieces.find(
        p => p.color === 'blue' && p.size === 1
      );

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

  describe('Serialization and History', () => {
    it('should serialize and deserialize game state correctly', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Make some changes to the state
      const ship = createShip('yellow', 1, 'player1');
      const star = createStar('blue', 2);
      const system = createSystem([star], [ship]);
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
      const star = createStar('blue', 2);
      const system = createSystem([star], [ship]);
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
});
