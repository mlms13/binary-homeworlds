import { Action, apply } from './actions/GameAction';
import * as Game from './models/Game';

export class Engine {
  private gameState: Game.GameState;
  private actionHistory: Array<Action>;

  constructor(actions: Array<Action> = []) {
    this.actionHistory = actions;
    this.gameState = actions.reduce<Game.GameState>(
      (state, action) => apply(state, action),
      Game.initial()
    );
  }
}
