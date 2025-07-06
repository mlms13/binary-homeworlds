/**
 * Main game engine for Binary Homeworlds
 */

import {
  GameAction,
  ActionValidationResult,
  SetupAction,
  MoveAction,
  CaptureAction,
  GrowAction,
  TradeAction,
  SacrificeAction,
  OverpopulationAction,
  Ship,
  System,
} from './types';
import { BinaryHomeworldsGameState } from './game-state';
import { ActionValidator } from './action-validator';
import {
  createShip,
  createStar,
  createSystem,
  getPiecesOfColor,
} from './utils';

export class GameEngine {
  private gameState: BinaryHomeworldsGameState;

  constructor(gameState?: BinaryHomeworldsGameState) {
    this.gameState = gameState || new BinaryHomeworldsGameState();
  }

  // Get current game state
  getGameState(): BinaryHomeworldsGameState {
    return this.gameState;
  }

  // Apply an action to the game state
  applyAction(action: GameAction): ActionValidationResult {
    // Validate the action
    const validation = ActionValidator.validate(
      action,
      this.gameState.getState()
    );
    if (!validation.valid) {
      return validation;
    }

    // Apply the action
    try {
      switch (action.type) {
        case 'setup':
          this.applySetupAction(action);
          break;
        case 'move':
          this.applyMoveAction(action);
          break;
        case 'capture':
          this.applyCaptureAction(action);
          break;
        case 'grow':
          this.applyGrowAction(action);
          break;
        case 'trade':
          this.applyTradeAction(action);
          break;
        case 'sacrifice':
          this.applySacrificeAction(action);
          break;
        case 'overpopulation':
          this.applyOverpopulationAction(action);
          break;
      }

      // Add action to history
      this.gameState.addActionToHistory(action);

      // Switch players (except for overpopulation which can be called by either player)
      if (action.type !== 'overpopulation') {
        if (action.type === 'setup') {
          // For setup, switch players after each action (alternating setup)
          this.gameState.switchPlayer();

          // Check if setup is complete after player switch
          const player1Home = this.gameState.getHomeSystem('player1');
          const player2Home = this.gameState.getHomeSystem('player2');

          if (
            player1Home &&
            player2Home &&
            player1Home.ships.length > 0 &&
            player2Home.ships.length > 0
          ) {
            this.gameState.setPhase('normal');
            // Setup is complete, ensure player1 starts normal play
            if (this.gameState.getCurrentPlayer() !== 'player1') {
              this.gameState.switchPlayer();
            }
          }
        } else {
          this.gameState.switchPlayer();
        }
      }

      // Check for game end after player switch (except during setup)
      if (action.type !== 'setup') {
        this.gameState.checkAndUpdateGameEnd();
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private applySetupAction(action: SetupAction): void {
    const piece = this.gameState.removePieceFromBank(action.pieceId);
    if (!piece) {
      throw new Error('Piece not found in bank');
    }

    const currentPlayer = this.gameState.getCurrentPlayer();

    if (action.role === 'star1') {
      // Create new home system with first star
      const star = createStar(piece.color, piece.size);
      star.id = piece.id; // Keep the same ID
      const system = createSystem([star]);
      this.gameState.addSystem(system);
      this.gameState.setHomeSystem(currentPlayer, system.id);
    } else if (action.role === 'star2') {
      // Add second star to home system
      const homeSystem = this.gameState.getHomeSystem(currentPlayer);
      if (!homeSystem) {
        throw new Error('Home system not found');
      }
      const star = createStar(piece.color, piece.size);
      star.id = piece.id; // Keep the same ID
      homeSystem.stars.push(star);
    } else if (action.role === 'ship') {
      // Add starting ship to home system
      const homeSystem = this.gameState.getHomeSystem(currentPlayer);
      if (!homeSystem) {
        throw new Error('Home system not found');
      }
      const ship = createShip(piece.color, piece.size, currentPlayer);
      ship.id = piece.id; // Keep the same ID
      homeSystem.ships.push(ship);
    }
  }

  private applyMoveAction(action: MoveAction): void {
    // Find the ship in the actual game state (not a copy)
    let ship: Ship | null = null;
    let fromSystem: System | null = null;

    for (const system of this.gameState.getSystemsRef()) {
      const foundShip = system.ships.find(s => s.id === action.shipId);
      if (foundShip) {
        ship = foundShip;
        fromSystem = system;
        break;
      }
    }

    if (!ship || !fromSystem) {
      throw new Error('Ship not found');
    }

    // Remove ship from origin system
    fromSystem.ships = fromSystem.ships.filter(s => s.id !== action.shipId);

    // Check if origin system should be cleaned up
    if (fromSystem.ships.length === 0) {
      // Return all stars to bank
      this.gameState.addPiecesToBank(fromSystem.stars);
      this.gameState.removeSystem(fromSystem.id);
    }

    if (action.toSystemId) {
      // Move to existing system
      const toSystem = this.gameState.getSystem(action.toSystemId);
      if (!toSystem) {
        throw new Error('Destination system not found');
      }
      toSystem.ships.push(ship);
    } else {
      // Create new system
      if (!action.newStarPieceId) {
        throw new Error('New star piece ID required');
      }

      const newStarPiece = this.gameState.removePieceFromBank(
        action.newStarPieceId
      );
      if (!newStarPiece) {
        throw new Error('New star piece not found in bank');
      }

      const newStar = createStar(newStarPiece.color, newStarPiece.size);
      newStar.id = newStarPiece.id;
      const newSystem = createSystem([newStar], [ship]);
      this.gameState.addSystem(newSystem);
    }
  }

  private applyCaptureAction(action: CaptureAction): void {
    const system = this.gameState.getSystem(action.systemId);
    if (!system) {
      throw new Error('System not found');
    }

    // Find target ship and change ownership
    const targetShip = system.ships.find(s => s.id === action.targetShipId);
    if (!targetShip) {
      throw new Error('Target ship not found');
    }

    targetShip.owner = action.player;
  }

  private applyGrowAction(action: GrowAction): void {
    const system = this.gameState.getSystem(action.systemId);
    if (!system) {
      throw new Error('System not found');
    }

    const newShipPiece = this.gameState.removePieceFromBank(
      action.newShipPieceId
    );
    if (!newShipPiece) {
      throw new Error('New ship piece not found in bank');
    }

    const newShip = createShip(
      newShipPiece.color,
      newShipPiece.size,
      action.player
    );
    newShip.id = newShipPiece.id;
    system.ships.push(newShip);
  }

  private applyTradeAction(action: TradeAction): void {
    const system = this.gameState.getSystem(action.systemId);
    if (!system) {
      throw new Error('System not found');
    }

    // Find ship to trade
    const ship = system.ships.find(s => s.id === action.shipId);
    if (!ship) {
      throw new Error('Ship not found');
    }

    // Get new piece from bank
    const newPiece = this.gameState.removePieceFromBank(action.newPieceId);
    if (!newPiece) {
      throw new Error('New piece not found in bank');
    }

    // Return old ship to bank as piece
    this.gameState.addPieceToBank({
      color: ship.color,
      size: ship.size,
      id: ship.id,
    });

    // Replace ship with new color
    ship.color = newPiece.color;
    ship.id = newPiece.id;
  }

  private applySacrificeAction(action: SacrificeAction): void {
    const system = this.gameState.getSystem(action.systemId);
    if (!system) {
      throw new Error('System not found');
    }

    // Remove sacrificed ship
    const sacrificedShip = system.ships.find(
      s => s.id === action.sacrificedShipId
    );
    if (!sacrificedShip) {
      throw new Error('Sacrificed ship not found');
    }

    system.ships = system.ships.filter(s => s.id !== action.sacrificedShipId);

    // Return sacrificed ship to bank
    this.gameState.addPieceToBank({
      color: sacrificedShip.color,
      size: sacrificedShip.size,
      id: sacrificedShip.id,
    });

    // Check if system should be cleaned up
    if (system.ships.length === 0) {
      this.gameState.addPiecesToBank(system.stars);
      this.gameState.removeSystem(system.id);
    }

    // Apply followup actions (but don't switch players or check game end for each)
    for (const followupAction of action.followupActions) {
      // For sacrifice followup actions, we skip normal validation since
      // sacrifice specifically allows actions that wouldn't normally be available

      // Apply the followup action directly without switching players
      switch (followupAction.type) {
        case 'move':
          this.applyMoveAction(followupAction);
          break;
        case 'capture':
          this.applyCaptureAction(followupAction);
          break;
        case 'grow':
          this.applyGrowAction(followupAction);
          break;
        case 'trade':
          this.applyTradeAction(followupAction);
          break;
      }

      // Add to history
      this.gameState.addActionToHistory(followupAction);
    }
  }

  private applyOverpopulationAction(action: OverpopulationAction): void {
    const system = this.gameState.getSystem(action.systemId);
    if (!system) {
      throw new Error('System not found');
    }

    // Get all pieces of the overpopulating color
    const overpopulatingPieces = getPiecesOfColor(system, action.color);

    // Remove all pieces of that color from the system
    system.stars = system.stars.filter(star => star.color !== action.color);
    system.ships = system.ships.filter(ship => ship.color !== action.color);

    // Return pieces to bank
    this.gameState.addPiecesToBank(
      overpopulatingPieces.map(piece => ({
        color: piece.color,
        size: piece.size,
        id: piece.id,
      }))
    );

    // If no stars remain, return all remaining ships to bank and remove system
    if (system.stars.length === 0) {
      this.gameState.addPiecesToBank(
        system.ships.map(ship => ({
          color: ship.color,
          size: ship.size,
          id: ship.id,
        }))
      );
      this.gameState.removeSystem(system.id);
    }

    // Check for game end after overpopulation
    this.gameState.checkAndUpdateGameEnd();
  }

  // Replay a sequence of actions to reconstruct game state
  static fromHistory(actions: GameAction[]): GameEngine {
    const engine = new GameEngine();

    for (const action of actions) {
      const result = engine.applyAction(action);
      if (!result.valid) {
        throw new Error(`Failed to replay action: ${result.error}`);
      }
    }

    return engine;
  }

  // Get available actions for current player
  getAvailableActions(): string[] {
    const state = this.gameState.getState();
    const actions: string[] = [];

    if (state.phase === 'setup') {
      actions.push('setup');
    } else if (state.phase === 'normal') {
      actions.push('move', 'capture', 'grow', 'trade', 'sacrifice');
    }

    // Overpopulation can always be declared if condition exists
    for (const system of state.systems) {
      for (const color of ['yellow', 'green', 'blue', 'red'] as const) {
        const pieces = getPiecesOfColor(system, color);
        if (pieces.length >= 4) {
          actions.push('overpopulation');
          break;
        }
      }
    }

    return [...new Set(actions)]; // Remove duplicates
  }
}
