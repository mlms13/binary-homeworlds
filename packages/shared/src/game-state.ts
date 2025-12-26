/**
 * GameState management class for Binary Homeworlds
 */

import { Bank, GamePiece, Player, StarSystem } from '@binary-homeworlds/engine';

import { GameAction, GamePhase, GameState } from './types';
import {
  addPiecesToEngineBank,
  addPieceToEngineBank,
  bankToPieces,
  checkGameEnd,
  cloneGameState,
  findSystem,
  getAllSystems,
  removePieceFromBankById,
} from './utils';

export class BinaryHomeworldsGameState {
  private state: GameState;

  constructor(initialState?: GameState) {
    if (initialState) {
      this.state = cloneGameState(initialState);
    } else {
      this.state = this.createInitialState();
    }
  }

  // Create the initial game state
  private createInitialState(): GameState {
    // Use Engine's full bank which contains all 36 pieces
    const bank = Bank.full;

    return {
      tag: 'setup',
      activePlayer: 'player1',
      systems: [],
      bank,
      homeSystems: {
        player1: StarSystem.createEmptyHomeSystem('player1'),
        player2: StarSystem.createEmptyHomeSystem('player2'),
      },
      gameHistory: [],
    };
  }

  // Get current state (immutable copy)
  getState(): GameState {
    return cloneGameState(this.state);
  }

  // Get current player
  getCurrentPlayer(): Player.Player {
    return this.state.activePlayer;
  }

  // Get game phase
  getPhase(): GamePhase {
    return this.state.tag;
  }

  // Get winner (if game has ended)
  getWinner(): Player.Player | undefined {
    return this.state.winner;
  }

  // Check if game has ended
  isGameEnded(): boolean {
    return this.getWinner() !== undefined;
  }

  // Get available pieces in bank
  getBankPieces(): Array<GamePiece.Piece> {
    return bankToPieces(this.state.bank);
  }

  // Get all systems (copies)
  getSystems(): Array<StarSystem.StarSystem> {
    return getAllSystems(this.state);
  }

  // Get direct reference to systems (for internal use)
  getSystemsRef(): Array<StarSystem.StarSystem> {
    return this.state.systems;
  }

  // Get a specific system by ID
  getSystem(systemId: string): StarSystem.StarSystem | undefined {
    return findSystem(this.state, systemId);
  }

  // Get player's home system
  getHomeSystem(player: Player.Player): StarSystem.StarSystem {
    return this.state.homeSystems[player];
  }

  // Get game history
  getHistory(): Array<GameAction> {
    return [...this.state.gameHistory];
  }

  // Add action to history
  addActionToHistory(action: GameAction): void {
    this.state.gameHistory.push(action);
  }

  // Switch to next player
  switchPlayer(): void {
    this.state.activePlayer =
      this.state.activePlayer === 'player1' ? 'player2' : 'player1';
  }

  // Set game phase
  setPhase(phase: GamePhase): void {
    this.state.tag = phase;
  }

  // Set winner and end game
  setWinner(winner: Player.Player): void {
    if (this.state.tag !== 'normal')
      throw new Error('Cannot set winner during setup');

    this.state = { ...this.state, winner };
  }

  // Add a new system
  addSystem(system: StarSystem.StarSystem): void {
    this.state.systems.push(system);
  }

  // Replace an existing system by ID with a new system
  setSystem(systemId: string, system: StarSystem.StarSystem): void {
    if (systemId === 'player1-home') {
      this.setHomeSystem('player1', system);
    } else if (systemId === 'player2-home') {
      this.setHomeSystem('player2', system);
    } else {
      const index = this.state.systems.findIndex(s => s.id === systemId);
      if (index === -1) {
        throw new Error('System not found');
      }
      this.state.systems[index] = system;
    }
  }

  // Remove a system
  removeSystem(systemId: string): void {
    this.state.systems = this.state.systems.filter(
      system => system.id !== systemId
    );
  }

  // Set player's home system
  setHomeSystem(player: Player.Player, system: StarSystem.StarSystem): void {
    this.state.homeSystems[player] = system;
  }

  // Remove piece from bank
  removePieceFromBank(pieceId: GamePiece.PieceId): GamePiece.Piece | null {
    const [piece, newBank] = removePieceFromBankById(this.state.bank, pieceId);
    if (piece) {
      this.state.bank = newBank;
    }
    return piece;
  }

  // Add piece to bank
  addPieceToBank(piece: GamePiece.Piece): void {
    this.state.bank = addPieceToEngineBank(piece, this.state.bank);
  }

  // Add pieces to bank (for overpopulation cleanup)
  addPiecesToBank(pieces: Array<GamePiece.Piece>): void {
    this.state.bank = addPiecesToEngineBank(pieces, this.state.bank);
  }

  getOverpopulations(): Array<{ systemId: string; color: GamePiece.Color }> {
    return getAllSystems(this.state).flatMap(system => {
      return StarSystem.getOverpopulations(system).map(color => ({
        systemId: system.id,
        color,
      }));
    });
  }

  // Check and update game end condition
  checkAndUpdateGameEnd(): boolean {
    const winner = checkGameEnd(this.state);
    if (winner) {
      this.setWinner(winner);
      return true;
    }
    return false;
  }

  // Create a new game state from action history (replay)
  static fromHistory(_actions: Array<GameAction>): BinaryHomeworldsGameState {
    const gameState = new BinaryHomeworldsGameState();

    // This would be implemented by the GameEngine
    // For now, we'll just return the initial state
    // The GameEngine will handle replaying actions
    return gameState;
  }

  // Validate that the current state is consistent
  validateState(): { valid: boolean; errors: Array<string> } {
    const errors: Array<string> = [];

    // Check that all systems have at least one star (except during setup)
    if (this.state.tag !== 'setup') {
      for (const system of this.state.systems) {
        if (system.stars.length === 0) {
          errors.push(`System ${system.id} has no stars`);
        }
      }
    }

    // Check that bank + all pieces in systems = 36 pieces
    const bankPieces = bankToPieces(this.state.bank);
    let totalPieces = bankPieces.length;
    for (const system of this.state.systems) {
      totalPieces += system.stars.length + system.ships.length;
    }
    if (totalPieces !== 36) {
      errors.push(`Total pieces is ${totalPieces}, expected 36`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
