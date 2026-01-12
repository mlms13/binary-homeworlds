import { full as fullBank, takePieceBySizeAndColor } from '../src/models/Bank';
import { GameState, initial } from '../src/models/Game';
import { createHomeSystem } from '../src/models/StarSystem';

const [p1star1, bank2] = takePieceBySizeAndColor(3, 'blue', fullBank);
const [p2star1, bank3] = takePieceBySizeAndColor(2, 'yellow', bank2);
const [p1star2, bank4] = takePieceBySizeAndColor(2, 'red', bank3);
const [p2star2, bank5] = takePieceBySizeAndColor(1, 'blue', bank4);
const [p1ship1, bank6] = takePieceBySizeAndColor(3, 'green', bank5);
const [p2ship1, bank7] = takePieceBySizeAndColor(3, 'green', bank6);

if (!p1star1 || !p1star2 || !p1ship1 || !p2star1 || !p2star2 || !p2ship1) {
  throw new Error('expected initial game pieces to exist');
}

const p1home = createHomeSystem(
  'player1',
  [p1star1, p1star2],
  [{ ...p1ship1, owner: 'player1' }]
);
const p2Home = createHomeSystem(
  'player2',
  [p2star1, p2star2],
  [{ ...p2ship1, owner: 'player2' }]
);

export const normalTestState: GameState<'normal'> = {
  ...initial(),
  tag: 'normal',
  bank: bank7,
  systems: [],
  homeSystems: {
    player1: p1home,
    player2: p2Home,
  },
  winner: undefined,
};
