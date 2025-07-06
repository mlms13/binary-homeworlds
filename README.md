# Binary Homeworlds Game Engine

A TypeScript implementation of the Binary Homeworlds game rules engine with event sourcing architecture.

## Features

- **Complete Rules Implementation**: Implements all Binary Homeworlds game rules as specified in RULES.md
- **Event Sourcing**: Game state is derived by replaying actions, enabling persistence and future multiplayer support
- **Serializable State**: Both actions and game state are fully serializable for storage and network transmission
- **Comprehensive Testing**: Includes tests for all examples from RULES.md plus extensive edge case coverage
- **Type Safety**: Full TypeScript implementation with strict typing

## Architecture

The game engine follows an event sourcing pattern where:

- **Actions** represent all possible game moves (setup, move, capture, grow, trade, sacrifice, overpopulation)
- **Game State** is derived by applying a sequence of actions
- **Immutability** is maintained through proper state management
- **Validation** ensures all actions follow the game rules

## Core Components

### GameEngine
The main class that applies actions and manages game flow:
```typescript
const engine = new GameEngine();
const result = engine.applyAction(action);
```

### BinaryHomeworldsGameState
Manages the current game state with serialization support:
```typescript
const gameState = engine.getGameState();
const serialized = gameState.serialize();
const restored = BinaryHomeworldsGameState.deserialize(serialized);
```

### Action Types
All game actions are strongly typed:
- `SetupAction` - Initial game setup
- `MoveAction` - Ship movement
- `CaptureAction` - Ship capture
- `GrowAction` - Ship creation
- `TradeAction` - Ship color change
- `SacrificeAction` - Ship sacrifice for multiple actions
- `OverpopulationAction` - Overpopulation declaration

## Usage

```typescript
import { GameEngine, createMoveAction } from './src';

// Create a new game
const engine = new GameEngine();

// Apply actions
const moveAction = createMoveAction('player1', shipId, fromSystemId, toSystemId);
const result = engine.applyAction(moveAction);

if (result.valid) {
  console.log('Move successful!');
} else {
  console.log('Move failed:', result.error);
}

// Get current state
const gameState = engine.getGameState();
console.log('Current player:', gameState.getCurrentPlayer());
console.log('Game phase:', gameState.getPhase());
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Watch mode for development
npm run dev
```

## Testing

The project includes comprehensive tests covering:
- All 11 examples from RULES.md
- Edge cases and error conditions
- Game setup and flow
- Action validation
- State management

Run tests with coverage:
```bash
npm run test:coverage
```

## UI Development

The project includes a React-based user interface for playing Binary Homeworlds.

### HTTPS Setup (Recommended)

For the best development experience, set up HTTPS with locally-trusted certificates:

```bash
# Install mkcert (macOS)
brew install mkcert

# Install the local CA in your system trust store
mkcert -install

# Generate certificates (run from project root)
mkcert localhost 127.0.0.1 ::1
```

### Starting the UI Development Server

```bash
npm run ui:dev
```

The UI will be available at:
- **HTTPS**: `https://localhost:3001` (recommended, requires mkcert setup)
- **HTTP**: `http://localhost:3001` (fallback if HTTPS fails)

### UI Features

- **Alternating Setup Phase**: Players take turns selecting stars and ships
- **Interactive Game Board**: Click ships to see available actions
- **Visual Piece Types**:
  - Stars displayed as diamonds (binary stars show nested diamonds)
  - Ships displayed as directional triangles pointing toward opponent
- **Enhanced Bank**: Larger triangle pieces with clear count indicators
- **Action Guidance**: Step-by-step instructions during setup
- **Real-time Updates**: Hot reload for immediate development feedback

### Building the UI

```bash
# Build for production
npm run ui:build

# Preview the built UI
npm run ui:preview
```

## Future Enhancements

The architecture is designed to support:
- Multiplayer gameplay over network
- Game state persistence
- Replay functionality
- AI player integration
- Real-time synchronization
