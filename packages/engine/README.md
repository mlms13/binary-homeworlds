# @binary-homeworlds/engine

Core game engine package implementing well-tested Binary Homeworlds game logic following the rules specification.

## Purpose

This package provides the foundational game models and logic used throughout the Binary Homeworlds application. All game rules are implemented with comprehensive test coverage to ensure correctness and reliability. See [RULES.md](./RULES.md) for the complete rules specification.

## Exports

The package uses namespace exports for clear context and to prevent naming collisions:

```typescript
import { Bank, GamePiece, Player } from '@binary-homeworlds/engine';

// Use namespace for functions and values
const emptyBank = Bank.empty;
const bank = Bank.addPiece(piece, Bank.empty);

// Use namespace for types
type MyBank = Bank.Bank;
type MyPiece = GamePiece.Piece;
```

### Available Namespaces

- **`Bank`**: Manages game pieces (empty, full, addPiece, takePiece, etc.)
- **`GamePiece`**: Core game piece types (Piece, Color, Size, PieceId, Ship, Star)
- **`Player`**: Player type definitions

## Development

See the root [README.md](../../README.md) for project setup, architecture, and development guidelines. When developing the engine package specifically, the following scripts are available:

### Build
- `npm run build` - Build the package (generates ESM and CJS outputs)
- `npm run dev` - Build in watch mode for development
- `npm run clean` - Remove build artifacts

### Testing
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Auto-fix linting errors
- `npm run format` - Check code formatting without modifying files
- `npm run format:fix` - Format code with Prettier (writes changes to files)
- `npm run typecheck` - Type-check without emitting files
