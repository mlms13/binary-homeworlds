import * as Game from '../models/Game';
import { ValidationResult } from '../models/ValidationResult';
import * as SetupAction from './SetupAction';

// exported because "shared" needs it for now
// TODO: remove this export once our action handling is consolidated
export type GameSetupAction = SetupAction.SetupAction;

export type GameAction = GameSetupAction;

export const takeStar = SetupAction.takeStarAction;
export const takeShip = SetupAction.takeShipAction;

export const validate = (
  state: Game.GameState,
  action: GameAction
): ValidationResult => {
  switch (action.type) {
    case 'setup:take_star':
    case 'setup:take_ship':
      return SetupAction.validateSetupAction(state, action);
  }
};

export const apply = (
  state: Game.GameState,
  action: GameAction
): Game.GameState => {
  switch (action.type) {
    case 'setup:take_star':
    case 'setup:take_ship':
      return SetupAction.apply(state, action);
  }
};
