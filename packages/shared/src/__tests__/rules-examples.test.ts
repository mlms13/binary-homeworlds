/**
 * Tests for all examples from RULES.md
 */

import { describe, expect, it } from 'vitest';

import {
  createCaptureAction,
  createGrowAction,
  createMoveAction,
  createOverpopulationAction,
  createSacrificeAction,
  createTradeAction,
} from '../action-builders';
import { GameEngine } from '../game-engine';
import { Color, Ship, Size } from '../types';
import {
  createPiece,
  createShip,
  createStar,
  createSystem,
  isColorAvailable,
} from '../utils';

describe('RULES.md Examples', () => {
  describe('Example 1: Basic availability', () => {
    it('should correctly determine available actions at a system', () => {
      // System: Small yellow star
      // Player A: Large green ship
      // Player B: Medium red ship

      const yellowStar = createStar('yellow', 1);
      const playerAShip = createShip('green', 3, 'player1');
      const playerBShip = createShip('red', 2, 'player2');

      const system = createSystem([yellowStar], [playerAShip, playerBShip]);

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
      const blueStar = createStar('blue', 3);
      const yellowStar = createStar('yellow', 1);
      const greenShip = createShip('green', 3, 'player1');
      const homeSystem = createSystem([blueStar, yellowStar], [greenShip]);

      gameState.addSystem(homeSystem);
      gameState.setHomeSystem('player1', homeSystem.id);

      // Player B: Medium yellow ship at Player A's home
      const playerBShip = createShip('yellow', 2, 'player2');
      homeSystem.ships.push(playerBShip);

      // Player A elsewhere: Small red ship
      const redShip = createShip('red', 1, 'player1');
      const redStar = createStar('green', 2); // Different color star
      const otherSystem = createSystem([redStar], [redShip]);
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
      const blueStar = createStar('blue', 2);
      const yellowStar = createStar('yellow', 3);
      const greenShip = createShip('green', 1, 'player1');
      const originSystem = createSystem([blueStar, yellowStar], [greenShip]);

      gameState.addSystem(originSystem);
      gameState.setPhase('normal');

      // Valid destinations: systems with only small stars
      const smallRedStar = createStar('red', 1);
      const validDestSystem = createSystem([smallRedStar]);
      gameState.addSystem(validDestSystem);

      // Invalid destinations: systems containing medium or large stars
      const mediumGreenStar = createStar('green', 2);
      const invalidDestSystem = createSystem([mediumGreenStar]);
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
      gameState2.addSystem(createSystem([blueStar, yellowStar], [greenShip]));
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
      const smallStar1 = createPiece('yellow', 1);
      const mediumStar1 = createPiece('blue', 2);
      const largeStar1 = createPiece('red', 3);
      const smallStar2 = createPiece('yellow', 1);
      const mediumStar2 = createPiece('blue', 2);
      const largeStar2 = createPiece('red', 3);
      const testShip: Ship = { ...createPiece('green', 2), owner: 'player1' }; // Ensure ship is owned by player1

      // Test Case 1: Moving from [small, large] to [large] should be INVALID
      // (large star in destination matches large star in origin)
      // Note: smallStar1 is yellow, so move action will be available
      const originSystem1 = createSystem([smallStar1, largeStar1], [testShip]);
      const destSystem1 = createSystem([largeStar2], []);

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

      const testShip2: Ship = { ...createPiece('green', 2), owner: 'player1' }; // Ensure ship is owned by player1
      // Add a yellow star to make move action available
      const yellowStar = createPiece('yellow', 3);
      const originSystem2 = createSystem(
        [mediumStar1, yellowStar],
        [testShip2]
      );
      const destSystem2 = createSystem([largeStar1, mediumStar2], []);

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

      const testShip3: Ship = { ...createPiece('green', 2), owner: 'player1' }; // Ensure ship is owned by player1
      // smallStar2 is yellow, so move action will be available
      const originSystem3 = createSystem(
        [smallStar2, mediumStar1],
        [testShip3]
      );
      const destSystem3 = createSystem([largeStar2], []);

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

      const testShip4: Ship = { ...createPiece('green', 2), owner: 'player1' }; // Ensure ship is owned by player1
      const extraStar = createPiece('green', 1);
      // smallStar1 is yellow, so move action will be available
      const originSystem4 = createSystem(
        [smallStar1, mediumStar2, largeStar1],
        [testShip4]
      );
      const destSystem4 = createSystem([extraStar], []); // Size 1 matches small star in origin

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
      const redStar = createStar('red', 3);
      const yellowShip = createShip('yellow', 2, 'player1');
      const system = createSystem([redStar], [yellowShip]);

      gameState.addSystem(system);
      gameState.setPhase('normal');

      // Create destination system
      const destStar = createStar('blue', 1); // Different size
      const destSystem = createSystem([destStar]);
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
      expect(gameState.getSystem(system.id)).toBeNull();
    });
  });

  describe('Example 5: Size restrictions for capture', () => {
    it('should enforce capture size restrictions', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // System: Small red star
      // Player A: Large yellow ship
      // Player B: Medium blue ship, small green ship
      const redStar = createStar('red', 1);
      const playerAShip = createShip('yellow', 3, 'player1');
      const playerBShip1 = createShip('blue', 2, 'player2');
      const playerBShip2 = createShip('green', 1, 'player2');

      const system = createSystem(
        [redStar],
        [playerAShip, playerBShip1, playerBShip2]
      );
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
      const system2 = createSystem(
        [redStar],
        [playerAShip, playerBShip1, playerBShip2]
      );
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
      const redStar3 = createStar('red', 1);

      const system3 = createSystem([redStar3], [playerAShip3, playerBShip3]);
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
      gameState.getState().bank.pieces = [];

      // Add non-red pieces (simplified for test)
      for (const color of ['yellow', 'green', 'blue'] as Color[]) {
        for (const size of [1, 2, 3] as Size[]) {
          for (let i = 0; i < 3; i++) {
            gameState.addPieceToBank(createPiece(color, size));
          }
        }
      }

      // Add specific red pieces: only medium and large (no small)
      const mediumRed = createPiece('red', 2);
      const largeRed = createPiece('red', 3);
      gameState.addPieceToBank(mediumRed);
      gameState.addPieceToBank(largeRed);

      // Player has: Medium red ship performing grow action
      // Need green star to make green action available
      const redShip = createShip('red', 2, 'player1');
      const greenStar = createStar('green', 2);
      const system = createSystem([greenStar], [redShip]);

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
        smallestRedPiece?.id ?? ''
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
      const nonRedPieces = bankPieces.filter(p => p.color !== 'red');
      gameState.getState().bank.pieces = nonRedPieces;

      // Player has: Red ship attempting to grow
      const redShip = createShip('red', 1, 'player1');
      const greenStar = createStar('green', 2);
      const system = createSystem([greenStar], [redShip]);

      gameState.addSystem(system);
      gameState.setPhase('normal');

      // Try to grow - should fail because no red pieces in bank
      const growAction = createGrowAction(
        'player1',
        redShip.id,
        system.id,
        'nonexistent-piece'
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
      const redStar = createStar('red', 3);
      const blueShip1 = createShip('blue', 2, 'player1');
      const blueShip2 = createShip('blue', 2, 'player1');
      const blueShip3 = createShip('blue', 1, 'player2');
      const blueShip4 = createShip('blue', 1, 'player1'); // 4th blue piece
      const yellowShip = createShip('yellow', 2, 'player2');

      const system = createSystem(
        [redStar],
        [blueShip1, blueShip2, blueShip3, blueShip4, yellowShip]
      );
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
      const redStar = createStar('red', 3);
      const redShip1 = createShip('red', 2, 'player1');
      const redShip2 = createShip('red', 2, 'player1');
      const greenShip = createShip('green', 3, 'player1');
      const yellowShip = createShip('yellow', 1, 'player1');

      const system = createSystem(
        [redStar],
        [redShip1, redShip2, greenShip, yellowShip]
      );
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
      expect(gameState.getSystem(system.id)).toBeNull();
    });
  });

  describe('Example 10: Multiple sacrifice actions', () => {
    it('should allow multiple actions from sacrifice', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // Set up a scenario where player can sacrifice large yellow ship for 3 move actions
      const yellowShip = createShip('yellow', 3, 'player1'); // Large ship = 3 actions
      const blueStar = createStar('blue', 2);
      const system1 = createSystem([blueStar], [yellowShip]);

      // Create other ships to move
      const ship1 = createShip('green', 1, 'player1');
      const ship2 = createShip('red', 2, 'player1');
      const ship3 = createShip('blue', 1, 'player1');

      const yellowStar = createStar('yellow', 1); // Changed to yellow to make yellow available
      const system2 = createSystem([yellowStar], [ship1, ship2, ship3]);

      // Create destination systems with different star sizes (all different from size 1)
      const mediumGreenStar = createStar('green', 2);
      const destSystem1 = createSystem([mediumGreenStar]);

      const largeYellowStar = createStar('yellow', 3);
      const destSystem2 = createSystem([largeYellowStar]);

      const largeBlueStar = createStar('blue', 3);
      const destSystem3 = createSystem([largeBlueStar]);

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
      expect(gameState.getSystem(system1.id)).toBeNull(); // Sacrificed ship was only ship
      expect(gameState.getSystem(system2.id)).toBeNull(); // All ships moved away
    });
  });

  describe('Example 11: Sacrifice timing', () => {
    it('should handle sacrifice timing and system cleanup correctly', () => {
      const engine = new GameEngine();
      const gameState = engine.getGameState();

      // System: Small red star
      // Player A: Medium blue ship
      const redStar = createStar('red', 1);
      const blueShip = createShip('blue', 2, 'player1');
      const system = createSystem([redStar], [blueShip]);

      // Create other ships for trade actions
      const greenShip = createShip('green', 2, 'player1');
      const yellowShip = createShip('yellow', 1, 'player1');
      const blueStar = createStar('blue', 3);
      const otherSystem = createSystem([blueStar], [greenShip, yellowShip]);

      gameState.addSystem(system);
      gameState.addSystem(otherSystem);
      gameState.setPhase('normal');

      // Add pieces to bank for trading
      const redPiece = {
        color: 'red' as Color,
        size: 2 as Size,
        id: 'red-piece',
      };
      const yellowPiece = {
        color: 'yellow' as Color,
        size: 1 as Size,
        id: 'yellow-piece',
      };
      gameState.addPieceToBank(redPiece);
      gameState.addPieceToBank(yellowPiece);

      const initialSystemCount = gameState.getSystems().length;

      // Player A sacrifices their blue ship for 2 blue actions
      const sacrificeAction = createSacrificeAction(
        'player1',
        blueShip.id,
        system.id,
        [
          createTradeAction(
            'player1',
            greenShip.id,
            otherSystem.id,
            redPiece.id
          ),
          createTradeAction(
            'player1',
            yellowShip.id,
            otherSystem.id,
            yellowPiece.id
          ),
        ]
      );

      const result = engine.applyAction(sacrificeAction);
      expect(result.valid).toBe(true);

      // Sequence should be: Remove ship → return red star to bank → perform 2 trade actions

      // The original system should be destroyed (no ships remain after sacrifice)
      expect(gameState.getSystems().length).toBe(initialSystemCount - 1);
      expect(gameState.getSystem(system.id)).toBeNull();

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
