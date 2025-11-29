import { describe, expect, it } from 'vitest';

import { Ship, Star } from '../src/models/GamePiece';
import {
  addShip,
  createNormal,
  getOverpopulations,
  hasOverpopulation,
  hasShip,
  removePiecesOfColor,
  removeShip,
  SystemValidationResult,
  validate,
} from '../src/models/StarSystem';

describe('Star System', () => {
  it('should create a normal star system', () => {
    const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
    const ships: Array<Ship> = [
      { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
    ];

    const system = createNormal(star, ships);
    expect(system.stars.length).toBe(1);
    expect(system.ships.length).toBe(1);
  });

  it('should determine that a system contains a ship', () => {
    const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
    const ships: Array<Ship> = [
      { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
    ];
    const system = createNormal(star, ships);
    const target: Ship = {
      color: 'yellow',
      size: 1,
      id: 'yellow-1-0',
      owner: 'player1',
    };
    const result = hasShip(target, system);
    expect(result).toBe(true);
  });

  it('should determine that a system does not contain a ship', () => {
    const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
    const ships: Array<Ship> = [
      { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
    ];
    const system = createNormal(star, ships);
    const target: Ship = {
      color: 'green',
      size: 1,
      id: 'green-1-0',
      owner: 'player2',
    };
    const result = hasShip(target, system);
    expect(result).toBe(false);
  });

  it('should validate a normal star system', () => {
    const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
    const ships: Array<Ship> = [
      { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
    ];
    const system = createNormal(star, ships);
    const result = validate(system);
    expect(result.valid).toBe(true);
  });

  it('should validate an invalid star system (no ships)', () => {
    const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
    const system = createNormal(star, []);
    const result: SystemValidationResult = validate(system);

    if (result.valid) throw new Error('System should be invalid');

    expect(result.piecesToCleanUp.length).toBe(1);

    // the star itself is included as a piece to be cleaned up
    expect(result.piecesToCleanUp[0]?.color).toBe('blue');
    expect(result.piecesToCleanUp[0]?.size).toBe(2);
  });

  it('should allow adding a ship to a star system', () => {
    const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
    const ships: Array<Ship> = [
      { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
    ];
    const system = createNormal(star, ships);
    const newShip: Ship = {
      color: 'green',
      size: 1,
      id: 'green-1-0',
      owner: 'player2',
    };

    const newSystem = addShip(newShip, system);
    expect(newSystem.ships.length).toBe(2);
    expect(hasShip(newShip, newSystem)).toBe(true);
  });

  it('should allow removing an existing ship from a star system', () => {
    const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
    const ship: Ship = {
      color: 'yellow',
      size: 1,
      id: 'yellow-1-0',
      owner: 'player1',
    };
    const system = createNormal(star, [ship]);
    const [removedShip, newSystem] = removeShip(ship, system);
    expect(removedShip).toBe(ship);
    expect(newSystem.ships.length).toBe(0);
    expect(hasShip(ship, newSystem)).toBe(false);
  });

  it('should return undefined when removing a ship that is not in the system', () => {
    const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
    const ships: Array<Ship> = [
      { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
    ];

    const target: Ship = {
      color: 'green',
      size: 1,
      id: 'green-1-0',
      owner: 'player2',
    };
    const system = createNormal(star, ships);
    const [removedShip, newSystem] = removeShip(target, system);
    expect(removedShip).toBeUndefined();
    expect(newSystem.ships.length).toBe(1);
  });

  describe('Overpopulations', () => {
    it('should determine that a system does not have overpopulation', () => {
      const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
      const ships: Array<Ship> = [
        { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
      ];
      const system = createNormal(star, ships);
      expect(getOverpopulations(system)).toEqual([]);
    });

    it('should determine that a system has overpopulation', () => {
      const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
      const ships: Array<Ship> = [
        { color: 'blue', size: 1, id: 'blue-1-0', owner: 'player1' },
        { color: 'blue', size: 1, id: 'blue-1-1', owner: 'player1' },
        { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
      ];
      const system = createNormal(star, ships);

      // initially, no overpopulation, and the system is valid
      expect(hasOverpopulation(system, 'blue')).toBe(false);
      expect(validate(system).valid).toBe(true);

      // add a 4th blue ship
      const newShip: Ship = {
        color: 'blue',
        size: 1,
        id: 'blue-1-2',
        owner: 'player2',
      };
      const newSystem = addShip(newShip, system);

      // the new system has overpopulation, but is still valid
      expect(getOverpopulations(newSystem)).toEqual(['blue']);
      expect(hasOverpopulation(newSystem, 'blue')).toBe(true);
      expect(validate(newSystem).valid).toBe(true);
    });

    it('should help clean up an overpopulated system', () => {
      const star: Star = { color: 'blue', size: 2, id: 'blue-2-0' };
      const ships: Array<Ship> = [
        { color: 'blue', size: 1, id: 'blue-1-0', owner: 'player1' },
        { color: 'blue', size: 1, id: 'blue-1-1', owner: 'player1' },
        { color: 'blue', size: 1, id: 'blue-1-2', owner: 'player1' },
        { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player2' },
      ];
      const system = createNormal(star, ships);
      const [removedPieces, newSystem] = removePiecesOfColor(system, 'blue');

      // removing blue pieces should return 4 blue pieces
      expect(removedPieces.length).toBe(4);
      expect(removedPieces.every(piece => piece.color === 'blue')).toBe(true);

      // the new system should have no overpopulation, but it should be invalid
      // as the star itself was removed
      expect(getOverpopulations(newSystem)).toEqual([]);

      const validationResult = validate(newSystem);
      expect(validationResult.valid).toBe(false);

      // when validating the new system, it should return the one remaining
      // yellow piece
      if (validationResult.valid) throw new Error('System should be invalid');
      expect(validationResult.piecesToCleanUp.length).toBe(1);
      expect(validationResult.piecesToCleanUp[0]?.color).toBe('yellow');
      expect(validationResult.piecesToCleanUp[0]?.size).toBe(1);
    });
  });
});
