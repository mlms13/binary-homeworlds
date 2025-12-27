import * as GameAction from './actions/GameAction';
import * as Game from './models/Game';

export class Engine {
  private gameState: Game.GameState;
  private actionHistory: Array<GameAction.GameAction>;

  constructor(actions: Array<GameAction.GameAction> = []) {
    this.actionHistory = actions;
    this.gameState = actions.reduce<Game.GameState>(
      (state, action) => GameAction.apply(state, action),
      Game.initial()
    );
  }
}
