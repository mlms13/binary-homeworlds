import { describe, expect, it } from 'vitest';

import { size } from '../src/models/Bank';
import {
  addPieceToBank,
  addSystem,
  createSystem,
  findSystem,
  GameState,
  getAllSystems,
  initial,
  maybeToNormal,
  removeSystemById,
  setSystemWithCleanup,
  switchActivePlayer,
  takePieceFromBank,
} from '../src/models/Game';
import { addShip, createNormal, removeShip } from '../src/models/StarSystem';
import { normalTestState } from './utils';

describe('Game', () => {
  it('should create an initial game state', () => {
    const game = initial();
    expect(size(game.bank)).toBe(36);
    expect(game.activePlayer).toBe('player1');
    expect(game.homeSystems.player1.stars).toHaveLength(0);
    expect(game.homeSystems.player2.stars).toHaveLength(0);
  });

  it('should switch the active player', () => {
    const game = initial();
    expect(game.activePlayer).toBe('player1');
    expect(switchActivePlayer(game).activePlayer).toBe('player2');
    expect(switchActivePlayer(switchActivePlayer(game)).activePlayer).toBe(
      'player1'
    );
  });

  // BKMRK: testing this directly is painful, and eventually we'll cover this
  // indirectly through action tests and state-setup helpers.
  it('should switch to normal state when home systems are valid', () => {
    const game: GameState = {
      ...initial(),
      tag: 'setup',

      // This star system is nonsense, but it's valid, which is enough to
      // allow the game state to switch to normal.
      homeSystems: {
        player1: createNormal({ color: 'blue', size: 2, id: 'blue-2-0' }, [
          { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
        ]),
        player2: createNormal({ color: 'green', size: 1, id: 'green-1-0' }, [
          { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player2' },
        ]),
      },
    };

    expect(game.tag).toBe('setup');
    expect(maybeToNormal(game).tag).toBe('normal');
  });

  it('should not switch to normal state when home systems are invalid', () => {
    const game = initial();
    expect(maybeToNormal(game)).toBe(game);
  });

  it('should not update an already-normal game state', () => {
    const game: GameState = {
      ...initial(),
      tag: 'normal',
      systems: [
        createNormal({ color: 'blue', size: 2, id: 'blue-2-0' }, [
          { color: 'yellow', size: 1, id: 'yellow-1-0', owner: 'player1' },
        ]),
      ],
      winner: undefined,
    };
    expect(maybeToNormal(game)).toBe(game);
  });

  describe('Bank', () => {
    it('should take a piece from the bank', () => {
      const game = initial();
      const [piece, newGame] = takePieceFromBank(1, 'yellow', game);
      expect(piece).toBeDefined();
      expect(piece?.color).toBe('yellow');
      expect(piece?.size).toBe(1);
      expect(piece?.id).toBe('yellow-1-0');
      expect(size(newGame.bank)).toBe(35);
    });

    it('should not take a piece from the bank if it is not available', () => {
      const game1 = initial();
      const [piece1, game2] = takePieceFromBank(1, 'yellow', game1);
      const [piece2, game3] = takePieceFromBank(1, 'yellow', game2);
      const [piece3, game4] = takePieceFromBank(1, 'yellow', game3);
      const [piece4, game5] = takePieceFromBank(1, 'yellow', game4);

      expect(piece1).toBeDefined();
      expect(piece2).toBeDefined();
      expect(piece3).toBeDefined();
      expect(piece4).toBeUndefined();
      expect(size(game5.bank)).toBe(33); // 3 removed pieces, one attempt that did nothing
    });

    it('should add a piece to the bank', () => {
      const game1 = initial();
      const [piece1, game2] = takePieceFromBank(1, 'yellow', game1);

      expect(piece1).toBeDefined();
      expect(size(game2.bank)).toBe(35);

      const game3 = addPieceToBank(piece1!, game2);
      expect(size(game3.bank)).toBe(36);
    });
  });

  describe('Systems', () => {
    it('should get all systems during setup', () => {
      expect(getAllSystems(initial())).toHaveLength(2);
    });

    it('should get all systems during normal phase', () => {
      const game: GameState = {
        ...initial(),
        tag: 'normal',
        systems: [createNormal({ color: 'blue', size: 2, id: 'blue-2-0' })],
        winner: undefined,
      };
      expect(getAllSystems(game)).toHaveLength(3);
    });

    it('should find a home system by id', () => {
      expect(findSystem('player1-home', initial())).toBeDefined();
    });

    it('should find a normal system', () => {
      const game: GameState = {
        ...initial(),
        tag: 'normal',
        systems: [createNormal({ color: 'blue', size: 2, id: 'blue-2-0' })],
        winner: undefined,
      };

      expect(findSystem('blue-2-0', game)).toBeDefined();
      expect(findSystem('yellow-3-1', game)).toBeUndefined();
    });

    it('should add a new system', () => {
      const game: GameState = {
        ...initial(),
        systems: [],
        tag: 'normal',
        winner: undefined,
      };

      expect(getAllSystems(game)).toHaveLength(2); // homeworlds only

      const system = createNormal({ color: 'green', size: 1, id: 'green-1-2' });
      const updated = addSystem(system, game);

      expect(getAllSystems(updated)).toHaveLength(3); // homeworlds + new
      expect(findSystem('green-1-2', updated)).toBeDefined();
    });

    it('should create a new system with the correct bank', () => {
      // first, we assert the count of large green ships in the bank given our
      // normal test state
      expect(normalTestState.bank.green[3]).toHaveLength(1);

      // then, create a new system using a large green ship
      const [id, updated] = createSystem(normalTestState, 3, 'green');
      if (!id) throw new Error('test should have created a new system');

      // we expect this to succeed in creating the system, and it should also
      // remove the piece from the bank
      expect(findSystem(id, updated)).toBeDefined();
      expect(updated.bank.green[3]).toHaveLength(0);
    });

    it('should not create a new system when the bank is missing the piece', () => {
      // our bank initially has a single large green ship remaining, which we
      // use
      const [id1, state2] = createSystem(normalTestState, 3, 'green');
      expect(id1).toBeDefined();

      // then, our second attempt should fail
      const [id2, state3] = createSystem(state2, 3, 'green');
      expect(id2).toBeUndefined();
      expect(state3.systems).toHaveLength(1);
    });

    it('should allow removing home systems during setup', () => {
      const game: GameState = {
        ...initial(),
        homeSystems: {
          player1: {
            id: 'player1-home',
            stars: [
              { color: 'blue', size: 3, id: 'blue-3-0' },
              { color: 'yellow', size: 1, id: 'yellow-1-0' },
            ],
            ships: [
              { color: 'green', size: 3, id: 'green-3-0', owner: 'player1' },
            ],
          },
          player2: {
            id: 'player2-home',
            stars: [
              { color: 'red', size: 2, id: 'red-2-0' },
              { color: 'blue', size: 1, id: 'blue-1-0' },
            ],
            ships: [
              { color: 'green', size: 3, id: 'green-3-2', owner: 'player2' },
            ],
          },
        },
      };

      // trying to remove a normal system during setup is a no-op
      expect(removeSystemById('blue-1-0', game)).toBe(game);

      // but home systems can be removed, which empties them
      const updated = removeSystemById('player2-home', game);
      expect(updated.homeSystems.player1.ships).toHaveLength(1);
      expect(updated.homeSystems.player1.stars).toHaveLength(2);
      expect(updated.homeSystems.player2.ships).toHaveLength(0);
      expect(updated.homeSystems.player2.stars).toHaveLength(0);

      // and home systems can be removed for both players
      const updated2 = removeSystemById('player1-home', game);
      expect(updated2.homeSystems.player1.ships).toHaveLength(0);
      expect(updated2.homeSystems.player1.stars).toHaveLength(0);
    });

    it('should allow removing normal systems during normal play', () => {
      const game: GameState = {
        ...initial(),
        systems: [],
        tag: 'normal',
        winner: undefined,
      };

      const withSystem = addSystem(
        createNormal({ color: 'red', size: 1, id: 'red-1-0' }, [
          { color: 'green', size: 2, id: 'green-2-1', owner: 'player1' },
        ]),
        game
      );

      expect(findSystem('red-1-0', withSystem)).toBeDefined();

      const withoutSystem = removeSystemById('red-1-0', withSystem);
      expect(withoutSystem.systems).toHaveLength(0);
    });

    it('should clean up a homeworld when set to an invalid system', () => {
      // We start with our "normal" state, which has a large green ship at both
      // players' home systems. Then we remove the ship from player1 and return
      // it to the bank
      const [piece, newSystem] = removeShip(
        { color: 'green', size: 3, id: 'green-3-0', owner: 'player1' },
        normalTestState.homeSystems.player1
      );

      if (!piece) throw new Error('failed to remove expected ship');

      const s2 = addPieceToBank(piece, normalTestState);
      const s3 = setSystemWithCleanup(newSystem, s2);

      expect(s3.homeSystems.player1.stars).toHaveLength(0);
      expect(s3.homeSystems.player1.ships).toHaveLength(0);
      expect(s3.homeSystems.player2.stars).toHaveLength(2);
      expect(s3.homeSystems.player2.ships).toHaveLength(1);
      expect(size(s3.bank)).toBe(33); // still 3 pieces at player 2's home
    });

    it('should return the same state when setting non-existant system', () => {
      const newSystem = createNormal({ color: 'red', size: 1, id: 'red-1-0' });
      const state = setSystemWithCleanup(newSystem, normalTestState);
      expect(state).toBe(normalTestState);
    });

    it('should return the same state when setting a sytem during setup', () => {
      // home worlds can be updated during setup, but non-homeworld systems
      // cannot exist until the "normal" state, so attempt to set a
      // non-homeworld system doesn't make sense and should be a no-op.
      const state = initial();
      const newSystem = createNormal({ color: 'red', size: 1, id: 'red-1-0' });
      const updated = setSystemWithCleanup(newSystem, state);
      expect(updated).toBe(state);
    });

    it('should replace a normal star system', () => {
      const [ship, s2] = takePieceFromBank(2, 'red', normalTestState);
      if (!ship) throw new Error('expected bank to contain piece');

      // add a system we don't care about, just for thoroughness
      const [_, s3] = createSystem(s2, 1, 'green');

      const [systemId, s4] = createSystem(s3, 3, 'yellow', [
        { ...ship, owner: 'player1' },
      ]);

      if (!systemId) throw new Error('test should have created a system');

      const foundSystem = findSystem(systemId, s4);
      if (!foundSystem) throw new Error('new system should exist');

      expect(s4.systems).toHaveLength(2);
      expect(size(s4.bank)).toBe(36 - 3 - 3 - 2 - 1);

      // create a new ship piece and add it to the same system
      const [ship2, s5] = takePieceFromBank(1, 'red', s4);
      if (!ship2) throw new Error('second ship should exist');

      const updatedSystem = addShip(
        { ...ship2, owner: 'player2' },
        foundSystem
      );

      const final = setSystemWithCleanup(updatedSystem, s5);
      const finalSystem = findSystem(systemId, final);

      expect(finalSystem).toBeDefined();
      expect(finalSystem!.ships).toHaveLength(2);
      expect(size(final.bank)).toBe(36 - 3 - 3 - 3 - 1);
    });
  });
});
