/**
 * Tests for all examples from RULES.md
 */

import { describe, expect, it } from 'vitest';

import { GamePiece, StarSystem } from '@binary-homeworlds/engine';

import {
  createCaptureAction,
  createGrowAction,
  createMoveAction,
  createOverpopulationAction,
  createSacrificeAction,
  createTradeAction,
} from '../action-builders';
import { GameEngine } from '../game-engine';
import { isColorAvailable } from '../utils';
import { createShip } from './utils';

describe('RULES.md Examples', () => {
  describe('Example 1: Basic availability', () => {
    it('should correctly determine available actions at a system', () => {
      // System: Small yellow star
      // Player A: Large green ship
      // Player B: Medium red ship

      const playerAShip = createShip('green', 3, 'player1');
      const playerBShip = createShip('red', 2, 'player2');
      const system = StarSystem.createNormal(
        { color: 'yellow', size: 1, id: 'yellow-1-0' },
        [playerAShip, playerBShip]
      );

      // Player A can move (yellow star) or grow (green ship)
      expect(isColorAvailable(system, 'yellow', 'player1')).toBe(true); // move
      expect(isColorAvailable(system, 'green', 'player1')).toBe(true); // grow
      expect(isColorAvailable(system, 'red', 'player1')).toBe(false); // capture - not available
      expect(isColorAvailable(system, 'blue', 'player1')).toBe(false); // trade - not available

      // Player B can move (yellow star) or capture (red ship)
      expect(isColorAvailable(system, 'yellow', 'player2')).toBe(true); // move
      expect(isColorAvailable(system, 'red', 'player2')).toBe(true); // capture
      expect(isColorAvailable(system, 'green', 'player2')).toBe(false); // grow - not available
      expect(isColorAvailable(system, 'blue', 'player2')).toBe(false); // trade - not available
    });
  });

  describe('Example 2: Sacrifice for unavailable actions', () => {
    it('should allow sacrifice to gain unavailable actions', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Set up the scenario through setup actions
      // Player A's home: Large blue star + small yellow star, with large green ship
      const greenShip = createShip('green', 3, 'player1');
      const homeSystem = StarSystem.createBinary(
        'player1',
        { color: 'blue', size: 3, id: 'blue-3-0' },
        { color: 'yellow', size: 1, id: 'yellow-1-0' },
        [greenShip]
      );

      gameState.addSystem(homeSystem);
      gameState.setHomeSystem('player1', homeSystem.id);

      // Player B: Medium yellow ship at Player A's home
      const playerBShip = createShip('yellow', 2, 'player2');
      homeSystem.ships.push(playerBShip);

      // Player A elsewhere: Small red ship
      const redShip = createShip('red', 1, 'player1');

      // Different color star
      const otherSystem = StarSystem.createNormal(
        { color: 'green', size: 2, id: 'green-2-0' },
        [redShip]
      );
      gameState.addSystem(otherSystem);

      gameState.setPhase('normal');
      // Ensure it's player1's turn
      if (gameState.getCurrentPlayer() !== 'player1') {
        gameState.switchPlayer();
      }

      // Player A cannot normally capture at home (no red available)
      expect(isColorAvailable(homeSystem, 'red', 'player1')).toBe(false);

      // But can sacrifice their small red ship elsewhere to gain 1 red action
      const sacrificeAction = createSacrificeAction(
        'player1',
        redShip.id,
        otherSystem.id,
        [
          createCaptureAction(
            'player1',
            greenShip.id,
            playerBShip.id,
            homeSystem.id
          ),
        ]
      );

      const result = engine.applyAction(sacrificeAction);
      expect(result.valid).toBe(true);

      // Player B's ship should now belong to Player A
      const updatedHomeSystem = gameState.getSystem(homeSystem.id);
      const capturedShip = updatedHomeSystem?.ships.find(
        s => s.id === playerBShip.id
      );
      expect(capturedShip?.owner).toBe('player1');
    });
  });

  describe('Example 3: Valid movement destinations', () => {
    it('should validate movement size restrictions correctly', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Origin system: Medium blue star + large yellow star
      const greenShip = createShip('green', 1, 'player1');
      const originSystem = StarSystem.createBinary(
        'player1',
        { color: 'blue', size: 2, id: 'blue-2-0' },
        { color: 'yellow', size: 3, id: 'yellow-3-0' },
        [greenShip]
      );

      gameState.addSystem(originSystem);
      gameState.setPhase('normal');

      // Valid destinations: systems with only small stars
      const validDestSystem = StarSystem.createNormal(
        { color: 'red', size: 1, id: 'red-1-0' },
        []
      );
      gameState.addSystem(validDestSystem);

      // Invalid destinations: systems containing medium or large stars
      const invalidDestSystem = StarSystem.createNormal(
        { color: 'green', size: 2, id: 'green-2-0' },
        []
      );
      gameState.addSystem(invalidDestSystem);

      // Valid move to system with small star
      const validMoveAction = createMoveAction(
        'player1',
        greenShip.id,
        originSystem.id,
        validDestSystem.id
      );

      let result = engine.applyAction(validMoveAction);
      expect(result.valid).toBe(true);

      // Reset for next test
      const engine2 = new GameEngine();
      const gameState2 = engine2.getGameState();
      gameState2.addSystem(originSystem);
      gameState2.addSystem(invalidDestSystem);
      gameState2.setPhase('normal');

      // Invalid move to system with medium star (same size as origin)
      const invalidMoveAction = createMoveAction(
        'player1',
        greenShip.id,
        originSystem.id,
        invalidDestSystem.id
      );

      result = engine2.applyAction(invalidMoveAction);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('different sizes');
    });

    it('should prevent moves when ANY destination star size matches ANY origin star size', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Create test pieces
      const yellow1 = { color: 'yellow', size: 1, id: 'yellow-1-0' } as const;
      const blue2 = { color: 'blue', size: 2, id: 'blue-2-0' } as const;
      const red3 = { color: 'red', size: 3, id: 'red-3-0' } as const;
      const mediumStar2: GamePiece.Star = {
        color: 'blue',
        size: 2,
        id: 'blue-2-0',
      };
      const largeStar2: GamePiece.Star = {
        color: 'red',
        size: 3,
        id: 'red-3-0',
      };
      const testShip: GamePiece.Ship = {
        color: 'green',
        size: 2,
        id: 'green-2-0',
        owner: 'player1',
      }; // Ensure ship is owned by player1

      // Test Case 1: Moving from [small, large] to [large] should be INVALID
      // (large star in destination matches large star in origin)
      // Note: yellow1 is yellow, so move action will be available
      const originSystem1 = StarSystem.createBinary('player1', yellow1, red3, [
        testShip,
      ]);
      const destSystem1 = StarSystem.createNormal(largeStar2, []);

      gameState.addSystem(originSystem1);
      gameState.addSystem(destSystem1);
      gameState.setPhase('normal');

      const invalidMoveAction1 = createMoveAction(
        'player1',
        testShip.id,
        originSystem1.id,
        destSystem1.id
      );

      let result = engine.applyAction(invalidMoveAction1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('different sizes');

      // Test Case 2: Moving from [medium] to [large, medium] should be INVALID
      // (medium star in destination matches medium star in origin)
      const engine2 = new GameEngine();
      const gameState2 = engine2.getGameState();

      const testShip2: GamePiece.Ship = {
        color: 'green',
        size: 2,
        id: 'green-2-0',
        owner: 'player1',
      }; // Ensure ship is owned by player1
      // Add a yellow star to make move action available
      const yellowStar: GamePiece.Star = {
        color: 'yellow',
        size: 3,
        id: 'yellow-3-0',
      };
      const originSystem2 = StarSystem.createBinary(
        'player1',
        blue2,
        yellowStar,
        [testShip2]
      );
      const destSystem2 = StarSystem.createBinary('player1', red3, mediumStar2);

      gameState2.addSystem(originSystem2);
      gameState2.addSystem(destSystem2);
      gameState2.setPhase('normal');

      const invalidMoveAction2 = createMoveAction(
        'player1',
        testShip2.id,
        originSystem2.id,
        destSystem2.id
      );

      result = engine2.applyAction(invalidMoveAction2);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('different sizes');

      // Test Case 3: Moving from [small, medium] to [large] should be VALID
      // (large star in destination doesn't match any origin star sizes)
      const engine3 = new GameEngine();
      const gameState3 = engine3.getGameState();

      const testShip3: GamePiece.Ship = {
        color: 'green',
        size: 2,
        id: 'green-2-0',
        owner: 'player1',
      }; // Ensure ship is owned by player1
      // yellow1 is yellow, so move action will be available
      const originSystem3 = StarSystem.createBinary('player1', yellow1, blue2, [
        testShip3,
      ]);
      const destSystem3 = StarSystem.createNormal(red3);

      gameState3.addSystem(originSystem3);
      gameState3.addSystem(destSystem3);
      gameState3.setPhase('normal');

      const validMoveAction = createMoveAction(
        'player1',
        testShip3.id,
        originSystem3.id,
        destSystem3.id
      );

      result = engine3.applyAction(validMoveAction);
      expect(result.valid).toBe(true);

      // Test Case 4: Moving from [small, medium, large] to [medium] should be INVALID
      // (medium star in destination matches medium star in origin)
      const engine4 = new GameEngine();
      const gameState4 = engine4.getGameState();

      const testShip4: GamePiece.Ship = {
        color: 'green',
        size: 2,
        id: 'green-2-0',
        owner: 'player1', // Ensure ship is owned by player1
      };
      // move is available via small yellow star
      const originSystem4 = StarSystem.createBinary(
        'player1',
        yellow1,
        mediumStar2,
        [testShip4]
      );
      const destSystem4 = StarSystem.createNormal(
        { color: 'green', size: 1, id: 'green-1-0' },
        []
      ); // Size 1 matches small star in origin

      gameState4.addSystem(originSystem4);
      gameState4.addSystem(destSystem4);
      gameState4.setPhase('normal');

      const invalidMoveAction4 = createMoveAction(
        'player1',
        testShip4.id,
        originSystem4.id,
        destSystem4.id
      );

      result = engine4.applyAction(invalidMoveAction4);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('different sizes');
    });
  });

  describe('Example 4: System cleanup after movement', () => {
    it('should return stars to bank when last ship leaves', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // System: Large red star with only one ship (medium yellow)
      const red3 = { color: 'red', size: 3, id: 'red-3-0' } as const;
      const yellowShip = createShip('yellow', 2, 'player1');
      const system = StarSystem.createNormal(red3, [yellowShip]);

      gameState.addSystem(system);
      gameState.setPhase('normal');

      // Create destination system
      const destStar: GamePiece.Star = {
        color: 'blue',
        size: 1,
        id: 'blue-1-0',
      }; // Different size
      const destSystem = StarSystem.createNormal(destStar, []);
      gameState.addSystem(destSystem);

      const initialBankSize = gameState.getBankPieces().length;
      const initialSystemCount = gameState.getSystems().length;

      // Move the yellow ship away
      const moveAction = createMoveAction(
        'player1',
        yellowShip.id,
        system.id,
        destSystem.id
      );

      const result = engine.applyAction(moveAction);
      expect(result.valid).toBe(true);

      // The red star should be returned to the bank
      expect(gameState.getBankPieces().length).toBe(initialBankSize + 1);

      // The system should be removed
      expect(gameState.getSystems().length).toBe(initialSystemCount - 1);
      expect(gameState.getSystem(system.id)).toBeUndefined();
    });
  });

  describe('Example 5: Size restrictions for capture', () => {
    it('should enforce capture size restrictions', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // System: Small red star
      // Player A: Large yellow ship
      // Player B: Medium blue ship, small green ship
      const redStar: GamePiece.Star = { color: 'red', size: 1, id: 'red-1-0' };
      const playerAShip = createShip('yellow', 3, 'player1');
      const playerBShip1 = createShip('blue', 2, 'player2');
      const playerBShip2 = createShip('green', 1, 'player2');

      const system = StarSystem.createNormal(redStar, [
        playerAShip,
        playerBShip1,
        playerBShip2,
      ]);
      gameState.addSystem(system);
      gameState.setPhase('normal');

      // Player A can capture either of Player B's ships (both are smaller than large)
      const captureAction1 = createCaptureAction(
        'player1',
        playerAShip.id,
        playerBShip1.id,
        system.id
      );

      let result = engine.applyAction(captureAction1);
      expect(result.valid).toBe(true);

      // Reset for next test
      const engine2 = new GameEngine();
      const gameState2 = engine2.getGameState();
      const system2 = StarSystem.createNormal(redStar, [
        playerAShip,
        playerBShip1,
        playerBShip2,
      ]);
      gameState2.addSystem(system2);
      gameState2.setPhase('normal');

      const captureAction2 = createCaptureAction(
        'player1',
        playerAShip.id,
        playerBShip2.id,
        system2.id
      );

      result = engine2.applyAction(captureAction2);
      expect(result.valid).toBe(true);

      // Player B cannot capture Player A's ship (medium < large)
      const engine3 = new GameEngine();
      const gameState3 = engine3.getGameState();

      // Create fresh ships for this test
      const playerAShip3 = createShip('yellow', 3, 'player1');
      const playerBShip3 = createShip('blue', 2, 'player2');
      const redStar3 = { color: 'red', size: 1, id: 'red-1-0' } as const;

      const system3 = StarSystem.createNormal(redStar3, [
        playerAShip3,
        playerBShip3,
      ]);
      gameState3.addSystem(system3);
      gameState3.setPhase('normal');
      gameState3.switchPlayer(); // Make it player2's turn

      const invalidCaptureAction = createCaptureAction(
        'player2',
        playerBShip3.id,
        playerAShip3.id,
        system3.id
      );

      result = engine3.applyAction(invalidCaptureAction);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('equal or larger size');
    });
  });

  describe('Example 6: Growth with limited bank', () => {
    it('should create ship with smallest available size', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Clear the bank and add only specific pieces
      // Remove all pieces from bank first
      const allBankPieces = gameState.getBankPieces();
      for (const piece of allBankPieces) {
        gameState.removePieceFromBank(piece.id);
      }

      // Add non-red pieces (simplified for test)
      for (const color of ['yellow', 'green', 'blue'] as const) {
        for (const size of [1, 2, 3] as const) {
          for (let i = 0; i < 3; i++) {
            gameState.addPieceToBank({
              color,
              size,
              id: `${color}-${size}-${i as 0 | 1 | 2}`,
            });
          }
        }
      }

      // Add specific red pieces: only medium and large (no small)
      const mediumRed = { color: 'red', size: 2, id: 'red-2-0' } as const;
      const largeRed = { color: 'red', size: 3, id: 'red-3-0' } as const;
      gameState.addPieceToBank(mediumRed);
      gameState.addPieceToBank(largeRed);

      // Player has: Medium red ship performing grow action
      // Need green star to make green action available
      const redShip = createShip('red', 2, 'player1');
      const greenStar: GamePiece.Star = {
        color: 'green',
        size: 2,
        id: 'green-2-0',
      };
      const system = StarSystem.createNormal(greenStar, [redShip]);

      gameState.addSystem(system);
      gameState.setPhase('normal');

      // Ensure it's player1's turn
      if (gameState.getCurrentPlayer() !== 'player1') {
        gameState.switchPlayer();
      }

      // Find the smallest available red piece in bank
      const bankRedPieces = gameState
        .getBankPieces()
        .filter(p => p.color === 'red');
      const smallestRedPiece = bankRedPieces.sort((a, b) => a.size - b.size)[0];

      // Grow action should create ship with smallest available size
      const growAction = createGrowAction(
        'player1',
        redShip.id,
        system.id,
        smallestRedPiece?.id ?? ('red-1-0' as const)
      );

      const result = engine.applyAction(growAction);
      expect(result.valid).toBe(true);

      // Check that smallest available red ship was created
      const updatedSystem = gameState.getSystem(system.id);
      const newShip = updatedSystem?.ships.find(
        s => s.id === (smallestRedPiece?.id ?? '')
      );
      expect(newShip).toBeDefined();
      expect(newShip?.color).toBe('red');
      expect(newShip?.size).toBe(smallestRedPiece?.size ?? 0);
      expect(newShip?.owner).toBe('player1');
    });
  });

  describe('Example 7: Growth impossible', () => {
    it('should fail when no pieces of required color are available', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Remove all red pieces from bank
      const bankPieces = gameState.getBankPieces();
      const redPieces = bankPieces.filter(p => p.color === 'red');
      for (const piece of redPieces) {
        gameState.removePieceFromBank(piece.id);
      }

      // Player has: Red ship attempting to grow
      const redShip = createShip('red', 1, 'player1');
      const greenStar: GamePiece.Star = {
        color: 'green',
        size: 2,
        id: 'green-2-0',
      };
      const system = StarSystem.createNormal(greenStar, [redShip]);

      gameState.addSystem(system);
      gameState.setPhase('normal');

      // Try to grow - should fail because no red pieces in bank
      const growAction = createGrowAction(
        'player1',
        redShip.id,
        system.id,
        'red-1-0' as const // Using valid ID format but piece won't be in bank
      );

      const result = engine.applyAction(growAction);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found in bank');
    });
  });

  describe('Example 8: Ship overpopulation', () => {
    it('should handle overpopulation correctly', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // System: Large red star
      // Player A: 2 medium blue ships
      // Player B: 1 small blue ship, 1 medium yellow ship
      // Add 4th blue piece to trigger overpopulation
      const redStar: GamePiece.Star = { color: 'red', size: 3, id: 'red-3-0' };
      const blueShip1 = createShip('blue', 2, 'player1');
      const blueShip2 = createShip('blue', 2, 'player1');
      const blueShip3 = createShip('blue', 1, 'player2');
      const blueShip4 = createShip('blue', 1, 'player1'); // 4th blue piece
      const yellowShip = createShip('yellow', 2, 'player2');

      const system = StarSystem.createNormal(redStar, [
        blueShip1,
        blueShip2,
        blueShip3,
        blueShip4,
        yellowShip,
      ]);
      gameState.addSystem(system);
      gameState.setPhase('normal');

      const initialBankSize = gameState.getBankPieces().length;

      // When a 4th blue piece arrives, declare overpopulation
      const overpopAction = createOverpopulationAction(
        'player1',
        system.id,
        'blue'
      );

      const result = engine.applyAction(overpopAction);
      expect(result.valid).toBe(true);

      // All blue ships should be returned to bank
      expect(gameState.getBankPieces().length).toBe(initialBankSize + 4);

      // System should now contain only the large red star and Player B's medium yellow ship
      const updatedSystem = gameState.getSystem(system.id);
      expect(updatedSystem?.ships.length).toBe(1);
      expect(updatedSystem?.ships[0]?.color).toBe('yellow');
      expect(updatedSystem?.ships[0]?.owner).toBe('player2');
      expect(updatedSystem?.stars.length).toBe(1);
      expect(updatedSystem?.stars[0]?.color).toBe('red');
    });
  });

  describe('Example 9: Star overpopulation causing system destruction', () => {
    it('should destroy system when overpopulation removes all stars', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // System: 1 large red star
      // Player A: 2 medium red ships, 1 large green ship, 1 small yellow ship
      const redStar: GamePiece.Star = { color: 'red', size: 3, id: 'red-3-0' };
      const redShip1 = createShip('red', 2, 'player1');
      const redShip2 = createShip('red', 2, 'player1');
      const greenShip = createShip('green', 3, 'player1');
      const yellowShip = createShip('yellow', 1, 'player1');

      const system = StarSystem.createNormal(redStar, [
        redShip1,
        redShip2,
        greenShip,
        yellowShip,
      ]);
      gameState.addSystem(system);
      gameState.setPhase('normal');
      gameState.switchPlayer(); // Make it player2's turn

      // Player B moves a small red ship to the star and declares overpopulation
      const newRedShip = createShip('red', 1, 'player2');
      system.ships.push(newRedShip);

      const initialBankSize = gameState.getBankPieces().length;
      const initialSystemCount = gameState.getSystems().length;

      const overpopAction = createOverpopulationAction(
        'player2',
        system.id,
        'red'
      );

      const result = engine.applyAction(overpopAction);
      expect(result.valid).toBe(true);

      // All red pieces (star + ships) should be returned to bank
      // Plus all remaining ships (green, yellow) should also be returned
      expect(gameState.getBankPieces().length).toBe(initialBankSize + 6); // 1 red star + 3 red ships + 1 green + 1 yellow

      // The star system should be destroyed
      expect(gameState.getSystems().length).toBe(initialSystemCount - 1);
      expect(gameState.getSystem(system.id)).toBeUndefined();
    });
  });

  describe('Example 10: Multiple sacrifice actions', () => {
    it('should allow multiple actions from sacrifice', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Set up a scenario where player can sacrifice large yellow ship for 3 move actions
      const yellowShip = createShip('yellow', 3, 'player1'); // Large ship = 3 actions
      const blueStar: GamePiece.Star = {
        color: 'blue',
        size: 2,
        id: 'blue-2-0',
      };
      const system1 = StarSystem.createNormal(blueStar, [yellowShip]);

      // Create other ships to move
      const ship1 = createShip('green', 1, 'player1');
      const ship2 = createShip('red', 2, 'player1');
      const ship3 = createShip('blue', 1, 'player1');

      const yellowStar: GamePiece.Star = {
        color: 'yellow',
        size: 1,
        id: 'yellow-1-0',
      };
      const system2 = StarSystem.createNormal(yellowStar, [
        ship1,
        ship2,
        ship3,
      ]);

      // Create destination systems with different star sizes (all different from size 1)
      const mediumGreenStar: GamePiece.Star = {
        color: 'green',
        size: 2,
        id: 'green-2-0',
      };
      const destSystem1 = StarSystem.createNormal(mediumGreenStar, []);

      const largeYellowStar: GamePiece.Star = {
        color: 'yellow',
        size: 3,
        id: 'yellow-3-0',
      };
      const destSystem2 = StarSystem.createNormal(largeYellowStar, []);

      const largeBlueStar: GamePiece.Star = {
        color: 'blue',
        size: 3,
        id: 'blue-3-0',
      };
      const destSystem3 = StarSystem.createNormal(largeBlueStar, []);

      gameState.addSystem(system1);
      gameState.addSystem(system2);
      gameState.addSystem(destSystem1);
      gameState.addSystem(destSystem2);
      gameState.addSystem(destSystem3);
      gameState.setPhase('normal');

      // Sacrifice large yellow ship for 3 yellow (move) actions
      const sacrificeAction = createSacrificeAction(
        'player1',
        yellowShip.id,
        system1.id,
        [
          createMoveAction('player1', ship1.id, system2.id, destSystem1.id),
          createMoveAction('player1', ship2.id, system2.id, destSystem2.id),
          createMoveAction('player1', ship3.id, system2.id, destSystem3.id),
        ]
      );

      const result = engine.applyAction(sacrificeAction);
      expect(result.valid).toBe(true);

      // All three ships should have moved to their destinations
      expect(gameState.getSystem(destSystem1.id)?.ships.length).toBe(1);
      expect(gameState.getSystem(destSystem2.id)?.ships.length).toBe(1);
      expect(gameState.getSystem(destSystem3.id)?.ships.length).toBe(1);

      // Original systems should be cleaned up
      expect(gameState.getSystem(system1.id)).toBeUndefined(); // Sacrificed ship was only ship
      expect(gameState.getSystem(system2.id)).toBeUndefined(); // All ships moved away
    });
  });

  describe('Example 11: Sacrifice timing', () => {
    it('should handle sacrifice timing and system cleanup correctly', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // System: Small red star
      // Player A: Medium blue ship
      const redStar: GamePiece.Star = { color: 'red', size: 1, id: 'red-1-0' };
      const blueShip = createShip('blue', 2, 'player1');
      const system = StarSystem.createNormal(redStar, [blueShip]);

      // Create other ships for trade actions
      const greenShip = createShip('green', 2, 'player1');
      const yellowShip = createShip('yellow', 1, 'player1');
      const blue3 = { color: 'blue', size: 3, id: 'blue-3-0' } as const;
      const otherSystem = StarSystem.createNormal(blue3, [
        greenShip,
        yellowShip,
      ]);

      gameState.addSystem(system);
      gameState.addSystem(otherSystem);
      gameState.setPhase('normal');

      // Add pieces to bank for trading
      const red2 = { color: 'red', size: 2, id: 'red-2-0' } as const;
      const yellow1 = { color: 'yellow', size: 1, id: 'yellow-1-0' } as const;
      gameState.addPieceToBank(red2);
      gameState.addPieceToBank(yellow1);

      const initialSystemCount = gameState.getSystems().length;

      // Player A sacrifices their blue ship for 2 blue actions
      const sacrificeAction = createSacrificeAction(
        'player1',
        blueShip.id,
        system.id,
        [
          createTradeAction('player1', greenShip.id, otherSystem.id, red2.id),
          createTradeAction(
            'player1',
            yellowShip.id,
            otherSystem.id,
            yellow1.id
          ),
        ]
      );

      const result = engine.applyAction(sacrificeAction);
      expect(result.valid).toBe(true);

      // Sequence should be: Remove ship → return red star to bank → perform 2 trade actions

      // The original system should be destroyed (no ships remain after sacrifice)
      expect(gameState.getSystems().length).toBe(initialSystemCount - 1);
      expect(gameState.getSystem(system.id)).toBeUndefined();

      // The red star should be returned to bank
      const bankPieces = gameState.getBankPieces();
      const returnedRedStar = bankPieces.find(p => p.id === redStar.id);
      expect(returnedRedStar).toBeDefined();

      // The trade actions should have been performed
      const updatedOtherSystem = gameState.getSystem(otherSystem.id);
      const tradedShip1 = updatedOtherSystem?.ships.find(
        s => s.id === greenShip.id
      );
      const tradedShip2 = updatedOtherSystem?.ships.find(
        s => s.id === yellowShip.id
      );

      expect(tradedShip1?.color).toBe('red'); // Was green, now red
      expect(tradedShip2?.color).toBe('yellow'); // Was yellow, stays yellow (traded for same color)
    });
  });
});
