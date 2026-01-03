import { describe, expect, it } from 'vitest';

import * as Action from '../src/actions/GameAction';
import { empty, size } from '../src/models/Bank';
import * as Game from '../src/models/Game';

describe('Setup Actions', () => {
  describe('Apply Actions', () => {
    it('should apply taking a star', () => {
      const action = Action.takeStar('yellow', 1, 'player1');
      const nextState = Action.apply(Game.initial(), action);

      expect(nextState.tag).toBe('setup');
      expect(nextState.activePlayer).toBe('player2');
      expect(nextState.homeSystems['player1'].stars.length).toBe(1);
      expect(nextState.homeSystems['player2'].stars.length).toBe(0);
      expect(size(nextState.bank)).toBe(35);
    });

    it('should apply taking a ship', () => {
      const state = [
        Action.takeStar('yellow', 3, 'player1'),
        Action.takeStar('green', 3, 'player2'),
        Action.takeStar('blue', 2, 'player1'),
        Action.takeStar('red', 2, 'player2'),
      ].reduce(Action.apply, Game.initial());

      const takeShipAction = Action.takeShip('green', 3, 'player1');
      const nextState = Action.apply(state, takeShipAction);

      expect(nextState.tag).toBe('setup');
      expect(nextState.activePlayer).toBe('player2');
      expect(nextState.homeSystems.player1.stars.length).toBe(2);
      expect(nextState.homeSystems.player2.stars.length).toBe(2);
      expect(size(nextState.bank)).toBe(31);
      expect(nextState.homeSystems.player1.ships.length).toBe(1);
      expect(nextState.homeSystems.player2.ships.length).toBe(0);
    });

    it('should switch to the normal phase when both home systems are complete', () => {
      const state = [
        Action.takeStar('yellow', 3, 'player1'),
        Action.takeStar('green', 3, 'player2'),
        Action.takeStar('blue', 2, 'player1'),
        Action.takeStar('red', 2, 'player2'),
        Action.takeShip('green', 3, 'player1'),
        Action.takeShip('yellow', 3, 'player2'),
      ].reduce(Action.apply, Game.initial());

      expect(state.tag).toBe('normal');
      expect(state.activePlayer).toBe('player1');
    });

    it('should no-op if the star is not found in the bank', () => {
      const state = { ...Game.initial(), bank: empty };
      const action = Action.takeStar('yellow', 1, 'player1');
      const nextState = Action.apply(state, action);
      expect(nextState).toBe(state);
    });

    it('should no-op if the ship is not found in the bank', () => {
      const state = { ...Game.initial(), bank: empty };
      const action = Action.takeShip('green', 3, 'player1');
      const nextState = Action.apply(state, action);
      expect(nextState).toBe(state);
    });
  });

  describe('Validation', () => {
    it('should allow a player taking a star', () => {
      const state = Game.initial();
      const action = Action.takeStar('yellow', 1, 'player1');
      const result = Action.validate(state, action);
      expect(result.valid).toBe(true);
    });

    it('should prevent the inactive player from making a move', () => {
      const state = Game.initial();
      const action = Action.takeStar('yellow', 1, 'player2');
      const result = Action.validate(state, action);

      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'wrong_player',
        expected: 'player1',
        actual: 'player2',
      });
    });

    it('should prevent taking a star that is not in the bank', () => {
      // player 1 takes 2 small yellow stars
      // player 2 takes 1 small yellow star
      const state = [
        Action.takeStar('yellow', 1, 'player1'),
        Action.takeStar('yellow', 1, 'player2'),
        Action.takeStar('yellow', 1, 'player1'),
      ].reduce(Action.apply, Game.initial());

      // player 2 tries to take a second small yellow star piece
      // but none remain in the bank
      const action = Action.takeStar('yellow', 1, 'player2');
      const result = Action.validate(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'piece_not_in_bank',
        color: 'yellow',
        size: 1,
      });
    });

    it('should prevent taking a ship that is not in the bank', () => {
      const state = [
        Action.takeStar('yellow', 1, 'player1'),
        Action.takeStar('yellow', 1, 'player2'),
        Action.takeStar('yellow', 1, 'player1'),
        Action.takeStar('green', 3, 'player2'),
      ].reduce(Action.apply, Game.initial());

      const action = Action.takeShip('yellow', 1, 'player1');
      const result = Action.validate(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'piece_not_in_bank',
        color: 'yellow',
        size: 1,
      });
    });

    it('should prevent setup actions during the normal phase', () => {
      const state = [
        Action.takeStar('blue', 3, 'player1'),
        Action.takeStar('yellow', 2, 'player2'),
        Action.takeStar('red', 1, 'player1'),
        Action.takeStar('green', 3, 'player2'),
        Action.takeShip('green', 3, 'player1'),
        Action.takeShip('blue', 3, 'player2'),
      ].reduce(Action.apply, Game.initial());

      // make sure we're in the normal phase
      expect(state.tag).toBe('normal');

      const action = Action.takeStar('yellow', 1, 'player1');
      const result = Action.validate(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'wrong_phase',
        expected: 'setup',
        actual: 'normal',
      });
    });

    it('should prevent taking a third star during setup', () => {
      const state = [
        Action.takeStar('blue', 3, 'player1'),
        Action.takeStar('yellow', 2, 'player2'),
        Action.takeStar('red', 1, 'player1'),
        Action.takeStar('green', 3, 'player2'),
      ].reduce(Action.apply, Game.initial());

      const action = Action.takeStar('yellow', 1, 'player1');
      const result = Action.validate(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'home_system_already_has_two_stars',
        player: 'player1',
      });
    });

    it('should prevent taking a ship before taking two stars', () => {
      const state = [
        Action.takeStar('blue', 3, 'player1'),
        Action.takeStar('yellow', 2, 'player2'),
      ].reduce(Action.apply, Game.initial());

      const action = Action.takeShip('green', 3, 'player1');
      const result = Action.validate(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'home_system_needs_two_stars',
        player: 'player1',
      });
    });
  });
});
