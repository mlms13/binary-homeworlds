# Binary Homeworlds - Multiplayer Game

A full-stack TypeScript implementation of Binary Homeworlds with multiplayer support, featuring a React frontend, Fastify backend server, and comprehensive game rules engine.

## Features

- **Complete Rules Implementation**: Implements all Binary Homeworlds game rules as specified in RULES.md
- **Multiplayer Support**: Real-time multiplayer gameplay with Socket.IO
- **Modern UI**: React-based interface with lobby system and game board
- **Event Sourcing**: Game state is derived by replaying actions, enabling persistence and replay functionality
- **Type Safety**: Full TypeScript implementation with strict typing across all packages
- **Comprehensive Testing**: Includes tests for all examples from RULES.md plus extensive edge case coverage

## Architecture

The project is organized as a monorepo with three main packages:

- **`packages/shared`**: Core game logic, rules engine, and shared types
- **`packages/server`**: Fastify backend server with Socket.IO for real-time multiplayer
- **`packages/ui-client`**: React frontend with Vite for fast development

### Game Engine Components

The game engine follows an event sourcing pattern where:

- **Actions** represent all possible game moves (setup, move, capture, grow, trade, sacrifice, overpopulation)
- **Game State** is derived by applying a sequence of actions
- **Immutability** is maintained through proper state management
- **Validation** ensures all actions follow the game rules

## Prerequisites

### Required Dependencies

1. **Node.js** (v18 or higher)
2. **Redis** (required for multiplayer server)

#### Installing Redis

**macOS:**
```bash
brew install redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
```

**Windows:**
Download from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

## Development Setup

### 1. Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd binary-homeworlds

# Install all dependencies
npm install
```

### 2. Start Redis

```bash
# Start Redis server (required for multiplayer functionality)
redis-server
```

### 3. Start Development Servers

```bash
# Start all services (shared, server, ui-client) concurrently
npm run dev
```

**Or start individual services:**

```bash
# Watch mode for shared package (game logic)
npm run dev:shared

# Backend server (port 3001)
npm run dev:server

# Frontend UI (port 3002)
npm run dev:ui
```

### 4. Access the Application

- **UI Client**: http://localhost:3002
- **Server API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Usage

### Multiplayer Gameplay

1. **Create a Game**: Choose between local, public, or private games
2. **Join a Game**: Browse available public games or join with a private code
3. **Game Setup**: Players take turns selecting stars and ships for their home systems
4. **Play**: Take turns performing actions (move, capture, grow, trade, sacrifice)
5. **Win**: Eliminate your opponent by capturing all their ships or destroying their home stars

### Game Actions

- **Move (Yellow)**: Move ships between systems
- **Capture (Red)**: Take control of opponent ships
- **Grow (Green)**: Create new ships
- **Trade (Blue)**: Exchange ships for different colors
- **Sacrifice**: Give up a ship for multiple actions

## Development

### Available Scripts

```bash
# Development
npm run dev                    # Start all services
npm run dev:shared            # Watch shared package
npm run dev:server            # Start server only
npm run dev:ui                # Start UI only

# Building
npm run build                 # Build all packages
npm run build:shared          # Build shared package
npm run build:server          # Build server
npm run build:ui              # Build UI

# Testing
npm run test                  # Run all tests
npm run test:shared           # Run shared package tests
npm run test:coverage -w packages/shared  # Run tests with coverage

# Code Quality
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run format                # Format code with Prettier
npm run format:check          # Check code formatting
npm run typecheck             # Run TypeScript type checking
```

### Project Structure

```
binary-homeworlds/
├── packages/
│   ├── shared/              # Game logic and rules engine
│   │   ├── src/
│   │   │   ├── game-engine.ts
│   │   │   ├── game-state.ts
│   │   │   ├── action-validator.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── package.json
│   ├── server/              # Backend server
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── services/
│   │   │   └── types.ts
│   │   └── package.json
│   └── ui-client/           # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   └── hooks/
│       └── package.json
├── RULES.md                 # Game rules documentation
└── package.json
```

## Testing

The project includes comprehensive tests covering:

- All 11 examples from RULES.md
- Edge cases and error conditions
- Game setup and flow
- Action validation
- State management

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage (shared package only)
npm run test:coverage -w packages/shared

# Run tests in watch mode
npm run test:watch -w packages/shared
```

## Environment Variables

### Server Configuration

Create a `.env` file in `packages/server/`:

```env
PORT=3001
HOST=0.0.0.0
REDIS_URL=redis://localhost:6379
```

### UI Client Configuration

Create a `.env` file in `packages/ui-client/`:

```env
VITE_SERVER_URL=http://localhost:3001
```

## Deployment

### Building for Production

```bash
# Build all packages
npm run build

# Start production server
npm run start -w packages/server
```

### Docker Deployment

The server can be deployed with Docker (requires Redis):

```bash
# Build server image
docker build -t binary-homeworlds-server packages/server/

# Run with Redis
docker run -p 3001:3001 --link redis:redis binary-homeworlds-server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `npm run test && npm run lint`
5. Submit a pull request

## License

ISC License
