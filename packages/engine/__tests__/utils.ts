import {
  addShipToHomeSystem,
  addStarToHomeSystem,
  createSystem,
  GameState,
  initial,
  maybeToNormal,
} from '../src/models/Game';
import { Color, Ship, Size } from '../src/models/GamePiece';
import { Player } from '../src/models/Player';

export class Game {
  private state: GameState;

  constructor(state?: GameState) {
    this.state = state ?? initial();
  }

  addStarToHomeSystem(player: Player, color: Color, size: Size) {
    if (this.state.tag !== 'setup') throw new Error('invalid state');
    this.state = addStarToHomeSystem(player, size, color, this.state);
    return this;
  }

  addShipToHomeSystem(player: Player, color: Color, size: Size) {
    if (this.state.tag !== 'setup') throw new Error('invalid state');
    this.state = addShipToHomeSystem(player, size, color, this.state);
    return this;
  }

  createSystem(color: Color, size: Size, ships?: Array<Ship>) {
    if (this.state.tag !== 'normal') throw new Error('invalid state');
    this.state = createSystem(this.state, size, color, ships)[1];
    return this;
  }

  run() {
    return this.state;
  }

  static chain(state?: GameState) {
    return new Game(state);
  }
}

const testState = Game.chain()
  .addStarToHomeSystem('player1', 'blue', 3)
  .addStarToHomeSystem('player2', 'yellow', 2)
  .addStarToHomeSystem('player1', 'red', 2)
  .addStarToHomeSystem('player2', 'blue', 1)
  .addShipToHomeSystem('player1', 'green', 3)
  .addShipToHomeSystem('player2', 'green', 3)
  .run();

// this is technically an unsafe coercion, but it's only for test data, and we
// can see above that this should produce a "normal" game state.
export const normalTestState = maybeToNormal(testState) as GameState<'normal'>;
