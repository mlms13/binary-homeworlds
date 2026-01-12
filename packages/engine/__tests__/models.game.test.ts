import { describe, expect, it } from 'vitest';

import { size } from '../src/models/Bank';
import {
  addPieceToBank,
  createSystem,
  findSystem,
  GameState,
  getAllSystems,
  initial,
  maybeToNormal,
  switchActivePlayer,
  takePieceFromBank,
} from '../src/models/Game';
import { createNormal } from '../src/models/StarSystem';
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
      const system = createNormal({ color: 'blue', size: 2, id: 'blue-2-0' });
      const game = { ...normalTestState, systems: [system] };
      expect(getAllSystems(game)).toHaveLength(3);
    });

    it('should find a home system by id', () => {
      expect(findSystem('player1-home', initial())).toBeDefined();
    });

    it('should find a normal system', () => {
      const system = createNormal({ color: 'blue', size: 2, id: 'blue-2-0' });
      const game = { ...normalTestState, systems: [system] };

      expect(findSystem('blue-2-0', game)).toBeDefined();
      expect(findSystem('yellow-3-1', game)).toBeUndefined();
    });

    it('should create a new system with the correct bank', () => {
      // first, we assert the count of large green ships in the bank given our
      // normal test state
      expect(normalTestState.bank.green[3]).toHaveLength(1);

      // then, create a new system using a large green ship
      const [system, updated] = createSystem(normalTestState, 3, 'green');
      if (!system) throw new Error('test should have created a new system');

      // we expect this to succeed in creating the system, and it should also
      // remove the piece from the bank
      expect(findSystem(system.id, updated)).toBeDefined();
      expect(updated.bank.green[3]).toHaveLength(0);
    });

    it('should not create a new system when the bank is missing the piece', () => {
      // our bank initially has a single large green piece remaining, which we
      // use
      const [system1, state2] = createSystem(normalTestState, 3, 'green');
      expect(system1).toBeDefined();

      //then, our second attempt should fail
      const [system2, state3] = createSystem(state2, 3, 'green');
      expect(system2).toBeUndefined();
      expect(state3.systems).toHaveLength(1);
      expect(state3).toBe(state2);
    });
  });
});
