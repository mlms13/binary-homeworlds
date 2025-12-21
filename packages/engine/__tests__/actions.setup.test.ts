import { describe, expect, it } from 'vitest';

import * as SetupAction from '../src/actions/SetupAction';
import { empty, size } from '../src/models/Bank';
import * as Game from '../src/models/Game';

describe('Setup Actions', () => {
  describe('Apply Actions', () => {
    it.skip('should apply taking a star', () => {
      const action = SetupAction.takeStarAction('yellow', 1, 'player1');
      const nextState = SetupAction.apply(Game.initial(), action);

      expect(nextState.tag).toBe('setup');
      expect(nextState.activePlayer).toBe('player2');
      expect(nextState.homeSystems.player1.stars.length).toBe(1);
      expect(nextState.homeSystems.player2.stars.length).toBe(0);
      expect(size(nextState.bank)).toBe(35);
    });

    it('should apply taking a ship', () => {
      const state = [
        SetupAction.takeStarAction('yellow', 3, 'player1'),
        SetupAction.takeStarAction('green', 3, 'player2'),
        SetupAction.takeStarAction('blue', 2, 'player1'),
        SetupAction.takeStarAction('red', 2, 'player2'),
      ].reduce(SetupAction.apply, Game.initial());

      const takeShipAction = SetupAction.takeShipAction('green', 3, 'player1');
      const nextState = SetupAction.apply(state, takeShipAction);

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
        SetupAction.takeStarAction('yellow', 3, 'player1'),
        SetupAction.takeStarAction('green', 3, 'player2'),
        SetupAction.takeStarAction('blue', 2, 'player1'),
        SetupAction.takeStarAction('red', 2, 'player2'),
        SetupAction.takeShipAction('green', 3, 'player1'),
        SetupAction.takeShipAction('yellow', 3, 'player2'),
      ].reduce(SetupAction.apply, Game.initial());

      expect(state.tag).toBe('normal');
      expect(state.activePlayer).toBe('player1');
    });

    it('should no-op if the star is not found in the bank', () => {
      const state = { ...Game.initial(), bank: empty };
      const action = SetupAction.takeStarAction('yellow', 1, 'player1');
      const nextState = SetupAction.apply(state, action);
      expect(nextState).toBe(state);
    });

    it('should no-op if the ship is not found in the bank', () => {
      const state = { ...Game.initial(), bank: empty };
      const action = SetupAction.takeShipAction('green', 3, 'player1');
      const nextState = SetupAction.apply(state, action);
      expect(nextState).toBe(state);
    });
  });

  describe('Validation', () => {
    it('should allow a player taking a star', () => {
      const state = Game.initial();
      const action = SetupAction.takeStarAction('yellow', 1, 'player1');
      const result = SetupAction.validateSetupAction(state, action);
      expect(result.valid).toBe(true);
    });

    it('should prevent the inactive player from making a move', () => {
      const state = Game.initial();
      const action = SetupAction.takeStarAction('yellow', 1, 'player2');
      const result = SetupAction.validateSetupAction(state, action);

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
        SetupAction.takeStarAction('yellow', 1, 'player1'),
        SetupAction.takeStarAction('yellow', 1, 'player2'),
        SetupAction.takeStarAction('yellow', 1, 'player1'),
      ].reduce(SetupAction.apply, Game.initial());

      // player 2 tries to take a second small yellow star piece
      // but none remain in the bank
      const action = SetupAction.takeStarAction('yellow', 1, 'player2');
      const result = SetupAction.validateSetupAction(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'piece_not_in_bank',
        color: 'yellow',
        size: 1,
      });
    });

    it('should prevent taking a ship that is not in the bank', () => {
      const state = [
        SetupAction.takeStarAction('yellow', 1, 'player1'),
        SetupAction.takeStarAction('yellow', 1, 'player2'),
        SetupAction.takeStarAction('yellow', 1, 'player1'),
        SetupAction.takeStarAction('green', 3, 'player2'),
      ].reduce(SetupAction.apply, Game.initial());

      const action = SetupAction.takeShipAction('yellow', 1, 'player1');
      const result = SetupAction.validateSetupAction(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'piece_not_in_bank',
        color: 'yellow',
        size: 1,
      });
    });

    it('should prevent setup actions during the normal phase', () => {
      const state = [
        SetupAction.takeStarAction('blue', 3, 'player1'),
        SetupAction.takeStarAction('yellow', 2, 'player2'),
        SetupAction.takeStarAction('red', 1, 'player1'),
        SetupAction.takeStarAction('green', 3, 'player2'),
        SetupAction.takeShipAction('green', 3, 'player1'),
        SetupAction.takeShipAction('blue', 3, 'player2'),
      ].reduce(SetupAction.apply, Game.initial());

      // make sure we're in the normal phase
      expect(state.tag).toBe('normal');

      const action = SetupAction.takeStarAction('yellow', 1, 'player1');
      const result = SetupAction.validateSetupAction(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'wrong_phase',
        expected: 'setup',
        actual: 'normal',
      });
    });

    it('should prevent taking a third star during setup', () => {
      const state = [
        SetupAction.takeStarAction('blue', 3, 'player1'),
        SetupAction.takeStarAction('yellow', 2, 'player2'),
        SetupAction.takeStarAction('red', 1, 'player1'),
        SetupAction.takeStarAction('green', 3, 'player2'),
      ].reduce(SetupAction.apply, Game.initial());

      const action = SetupAction.takeStarAction('yellow', 1, 'player1');
      const result = SetupAction.validateSetupAction(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'home_system_already_has_two_stars',
        player: 'player1',
      });
    });

    it('should prevent taking a ship before taking two stars', () => {
      const state = [
        SetupAction.takeStarAction('blue', 3, 'player1'),
        SetupAction.takeStarAction('yellow', 2, 'player2'),
      ].reduce(SetupAction.apply, Game.initial());

      const action = SetupAction.takeShipAction('green', 3, 'player1');
      const result = SetupAction.validateSetupAction(state, action);
      if (result.valid) throw new Error('Expected validation to fail');

      expect(result.error).toEqual({
        type: 'home_system_needs_two_stars',
        player: 'player1',
      });
    });
  });
});
