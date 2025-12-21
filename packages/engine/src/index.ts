// Namespace exports - provides clear context and prevents collisions
// All exports (types, functions, values) are accessible via namespace
//
// Usage examples:
//   import { Bank, GamePiece } from '@binary-homeworlds/engine';
//   const empty = Bank.empty;
//   const bank = Bank.addPiece(piece, Bank.empty);
//   type MyBank = Bank.Bank;
//   type MyPiece = GamePiece.Piece;
import * as GameActionModule from './actions/GameAction';
import * as BankModule from './models/Bank';
import * as GameModule from './models/Game';
import * as GamePieceModule from './models/GamePiece';
import * as PlayerModule from './models/Player';
import * as StarSystemModule from './models/StarSystem';

// Export namespaces - provides clear context for all exports
export {
  BankModule as Bank,
  GameModule as Game,
  GameActionModule as GameAction,
  GamePieceModule as GamePiece,
  PlayerModule as Player,
  StarSystemModule as StarSystem,
};
