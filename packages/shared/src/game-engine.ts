/**
 * Main game engine for Binary Homeworlds
 */

import { GamePiece, StarSystem } from '@binary-homeworlds/engine';

import { ActionValidator } from './action-validator';
import { BinaryHomeworldsGameState } from './game-state';
import {
  ActionValidationResult,
  CaptureAction,
  GameAction,
  GrowAction,
  MoveAction,
  OverpopulationAction,
  SacrificeAction,
  SetupAction,
  TradeAction,
} from './types';

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
      const system = StarSystem.createNormal(piece, []);
      this.gameState.addSystem(system);
      this.gameState.setHomeSystem(currentPlayer, system.id);
    } else if (action.role === 'star2') {
      // Add second star to home system
      const homeSystem = this.gameState.getHomeSystem(currentPlayer);
      if (!homeSystem) {
        throw new Error('Home system not found');
      }
      const updatedSystem = StarSystem.addStar(piece, homeSystem);
      this.gameState.setSystem(homeSystem.id, updatedSystem);
    } else if (action.role === 'ship') {
      // Add starting ship to home system
      const homeSystem = this.gameState.getHomeSystem(currentPlayer);
      if (!homeSystem) {
        throw new Error('Home system not found');
      }
      const ship = { ...piece, owner: currentPlayer };
      const updatedSystem = StarSystem.addShip(ship, homeSystem);
      this.gameState.setSystem(homeSystem.id, updatedSystem);
    }
  }

  private applyMoveAction(action: MoveAction): void {
    // Find the ship in the actual game state (not a copy)
    let ship: GamePiece.Ship | undefined = undefined;
    let fromSystem: StarSystem.StarSystem | undefined = undefined;

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
    const [removed, updatedFrom] = StarSystem.removeShip(ship, fromSystem);
    if (!removed) {
      throw new Error('Failed to remove ship from origin system');
    }

    // Update the origin system
    this.gameState.setSystem(fromSystem.id, updatedFrom);

    // Check if origin system should be cleaned up
    const validation = StarSystem.validate(updatedFrom);
    if (!validation.valid) {
      // Return all pieces to bank
      this.gameState.addPiecesToBank(validation.piecesToCleanUp);
      this.gameState.removeSystem(fromSystem.id);
    }

    if (action.toSystemId) {
      // Move to existing system
      const toSystem = this.gameState.getSystem(action.toSystemId);
      if (!toSystem) {
        throw new Error('Destination system not found');
      }
      const updatedTo = StarSystem.addShip(ship, toSystem);
      this.gameState.setSystem(action.toSystemId, updatedTo);
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

      const newSystem = StarSystem.createNormal(newStarPiece, [ship]);
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

    // Use StarSystem.changeShipOwner to immutably update the system
    const updatedSystem = StarSystem.changeShipOwner(targetShip, system);
    this.gameState.setSystem(action.systemId, updatedSystem);
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

    const newShip = { ...newShipPiece, owner: action.player };
    const updatedSystem = StarSystem.addShip(newShip, system);
    this.gameState.setSystem(action.systemId, updatedSystem);
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

    const [removedPiece, updatedSystem] = StarSystem.removeShip(
      sacrificedShip,
      system
    );
    if (!removedPiece) {
      throw new Error('Failed to remove sacrificed ship');
    }

    // Update the system
    this.gameState.setSystem(action.systemId, updatedSystem);

    // Return sacrificed ship to bank
    this.gameState.addPieceToBank({
      color: sacrificedShip.color,
      size: sacrificedShip.size,
      id: sacrificedShip.id,
    });

    // Check if system should be cleaned up
    const validation = StarSystem.validate(updatedSystem);
    if (!validation.valid) {
      this.gameState.addPiecesToBank(validation.piecesToCleanUp);
      this.gameState.removeSystem(system.id);
    }

    // Check for game end immediately after sacrifice (before followup actions)
    // This is crucial: if sacrificing leaves the player with no ships at home, they lose
    // Only check if this was at the player's home system
    const isHomeSystem =
      this.gameState.getState().players[action.player].homeSystemId ===
      action.systemId;
    if (isHomeSystem) {
      const gameEnded = this.gameState.checkAndUpdateGameEnd();
      if (gameEnded) {
        // Game has ended, don't process followup actions
        return;
      }
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

    // Remove all pieces of the overpopulating color from the system
    const [removedPieces, updatedSystem] = StarSystem.removePiecesOfColor(
      system,
      action.color
    );

    // Update the system
    this.gameState.setSystem(action.systemId, updatedSystem);

    // Return pieces to bank
    this.gameState.addPiecesToBank(removedPieces);

    // Check if system should be cleaned up
    const validation = StarSystem.validate(updatedSystem);
    if (!validation.valid) {
      this.gameState.addPiecesToBank(validation.piecesToCleanUp);
      this.gameState.removeSystem(system.id);
    }

    // Check for game end after overpopulation
    this.gameState.checkAndUpdateGameEnd();
  }

  // Replay a sequence of actions to reconstruct game state
  static fromHistory(actions: Array<GameAction>): GameEngine {
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
  getAvailableActions(): Array<string> {
    const state = this.gameState.getState();
    const actions: Array<string> = [];

    if (state.tag === 'setup') {
      actions.push('setup');
    } else if (state.tag === 'normal') {
      actions.push('move', 'capture', 'grow', 'trade', 'sacrifice');
    }

    // Overpopulation can always be declared if condition exists
    for (const system of state.systems) {
      const overpopulations = StarSystem.getOverpopulations(system);
      if (overpopulations.length > 0) {
        actions.push('overpopulation');
        break;
      }
    }

    return Array.from(new Set(actions)); // Remove duplicates
  }
}
