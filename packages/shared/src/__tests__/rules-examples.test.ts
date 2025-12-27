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
  createSetupAction,
  createTradeAction,
} from '../action-builders';
import { GameEngine } from '../game-engine';
import { createShip } from './utils';

describe('RULES.md Examples', () => {
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

      gameState.setHomeSystem('player1', homeSystem);

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

      gameState.setPhase('normal');
      gameState.addSystem(otherSystem);

      // Ensure it's player1's turn
      if (gameState.getCurrentPlayer() !== 'player1') {
        gameState.switchPlayer();
      }

      // Player A cannot normally capture at home (no red available)
      expect(StarSystem.isColorAvailable('player1', 'red', homeSystem)).toBe(
        false
      );

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

      gameState.setPhase('normal');
      gameState.addSystem(originSystem);

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
      gameState2.setPhase('normal');
      gameState2.addSystem(originSystem);
      gameState2.addSystem(invalidDestSystem);

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

      gameState.setPhase('normal');
      gameState.addSystem(originSystem1);
      gameState.addSystem(destSystem1);

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

      gameState2.setPhase('normal');
      gameState2.addSystem(originSystem2);
      gameState2.addSystem(destSystem2);

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

      gameState3.setPhase('normal');
      gameState3.addSystem(originSystem3);
      gameState3.addSystem(destSystem3);

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

      gameState4.setPhase('normal');
      gameState4.addSystem(originSystem4);
      gameState4.addSystem(destSystem4);

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

      gameState.setPhase('normal');
      gameState.addSystem(system);

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
      gameState.setPhase('normal');
      gameState.addSystem(system);

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
      gameState2.setPhase('normal');
      gameState2.addSystem(system2);

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
      gameState3.setPhase('normal');
      gameState3.addSystem(system3);
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

      gameState.setPhase('normal');
      gameState.addSystem(system);

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

      gameState.setPhase('normal');
      gameState.addSystem(system);

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
      gameState.setPhase('normal');
      gameState.addSystem(system);

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
      gameState.setPhase('normal');
      gameState.addSystem(system);
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

      gameState.setPhase('normal');
      gameState.addSystem(system1);
      gameState.addSystem(system2);
      gameState.addSystem(destSystem1);
      gameState.addSystem(destSystem2);
      gameState.addSystem(destSystem3);

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
      // The scenario:
      // Player 1's homeworld: blue-3 star, red-1 star, green-3 ship, yellow-1 ship
      // Player 2's homeworld: blue-3 star, yellow-2 star, green-3 ship, yellow-1 ship
      // System 1: yellow-1 star, player 1 has a blue-3 ship
      // System 2: green-3 star, player 1 has a green-1 ship and a red-3 ship
      //
      // Crucially, this means that green-3, yellow-1, and blue-3 are all missing from the bank.
      //
      // Player 1 sacrifices the blue-3 ship at System 1, returning it and yellow-1 star to the bank
      // green-3 at their home system can now be traded for blue-3 which is back in the bank
      // their green-1 ship at System 2 can be traded for yellow-1
      // their red-3 ship can be traded for the green3 that used to be at home

      // we'll use regular game actions to get through the initial setup
      const actions = [
        createSetupAction('player1', 'blue', 3, 'star1'),
        createSetupAction('player2', 'blue', 3, 'star1'),
        createSetupAction('player1', 'red', 1, 'star2'),
        createSetupAction('player2', 'yellow', 2, 'star2'),
        createSetupAction('player1', 'green', 3, 'ship'),
        createSetupAction('player2', 'green', 3, 'ship'),
        createGrowAction('player1', 'green-3-0', 'player1-home', 'green-1-0'),
        createGrowAction('player2', 'green-3-1', 'player2-home', 'green-1-1'),
        createTradeAction('player1', 'green-1-0', 'player1-home', 'yellow-1-0'),
        createTradeAction('player2', 'green-1-1', 'player2-home', 'yellow-1-1'),
      ];

      const engine = GameEngine.fromHistory(actions);
      const gameState = engine.getGameState();

      // at this point, let's assert that each homeworld has 2 stars and 2 ships
      // and that the bank has the remaining 28 pieces
      expect(gameState.getHomeSystem('player1').stars).toHaveLength(2);
      expect(gameState.getHomeSystem('player1').ships).toHaveLength(2);
      expect(gameState.getHomeSystem('player2').stars).toHaveLength(2);
      expect(gameState.getHomeSystem('player2').ships).toHaveLength(2);
      expect(gameState.getBankPieces()).toHaveLength(28);

      // with our home systems set up, let's insert two normal systems

      // System: Small yellow star
      // Player 1: Large blue ship
      const yellowStar = gameState.removePieceFromBank('yellow-1-2');
      const largeBlueShip = gameState.removePieceFromBank('blue-3-2');
      if (!yellowStar || !largeBlueShip) throw new Error('Missing piece');
      const system1 = StarSystem.createNormal(yellowStar, [
        { ...largeBlueShip, owner: 'player1' },
      ]);

      // System 2: green-3 star, player 1 has a green-1 ship and a red-3 ship
      // System: Large green star
      // Player 1: Small green ship, large red ship
      const greenStar = gameState.removePieceFromBank('green-3-2');
      const smallGreenShip = gameState.removePieceFromBank('green-1-2');
      const largeRedShip = gameState.removePieceFromBank('red-3-0');
      if (!greenStar || !smallGreenShip || !largeRedShip)
        throw new Error('Missing piece');

      const system2 = StarSystem.createNormal(greenStar, [
        { ...smallGreenShip, owner: 'player1' },
        { ...largeRedShip, owner: 'player1' },
      ]);

      gameState.addSystem(system1);
      gameState.addSystem(system2);

      // assert that the bank has 5 fewer pieces than before
      // and there are two additional systems
      expect(gameState.getBankPieces()).toHaveLength(23);
      expect(gameState.getSystems()).toHaveLength(4);

      // Player A sacrifices their blue ship for 3 blue actions
      const sacrificeAction = createSacrificeAction(
        'player1',
        'blue-3-2',
        'yellow-1-2',
        [
          createTradeAction('player1', 'green-3-0', 'player1-home', 'blue-3-2'),
          createTradeAction('player1', 'green-1-2', 'green-3-2', 'yellow-1-2'),
          createTradeAction('player1', 'red-3-0', 'green-3-2', 'green-3-0'),
        ]
      );

      const result = engine.applyAction(sacrificeAction);
      expect(result.error).toBeUndefined();
      expect(result.valid).toBe(true);

      // The original system should be destroyed (no ships remain after sacrifice)
      expect(gameState.getSystems().length).toBe(3);
      expect(gameState.getSystem('yellow-1-2')).toBeUndefined();
    });
  });
});
