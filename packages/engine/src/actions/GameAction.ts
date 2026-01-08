import { GameState } from '../models/Game';
import * as ValidationResult from '../models/ValidationResult';
import {
  apply as applySetupAction,
  SetupAction,
  takeShipAction,
  takeStarAction,
  validate as validateSetupAction,
} from './SetupAction';

export type Action = SetupAction;

// Constructors
export const takeStar = takeStarAction;
export const takeShip = takeShipAction;

export const validate = (
  state: GameState,
  action: Action
): ValidationResult.ValidationResult => {
  switch (action.type) {
    case 'setup:take_star':
    case 'setup:take_ship':
      // Check that we're in the appropriate phase
      if (state.tag !== 'setup') {
        return ValidationResult.wrongPhase({
          expected: 'setup',
          actual: state.tag,
        });
      }
      return validateSetupAction(state, action);
  }
};

export const apply = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'setup:take_ship':
    case 'setup:take_star':
      if (state.tag !== 'setup') return state;
      return applySetupAction(state, action);
  }
};
