/**
 * GameState management class for Binary Homeworlds
 */

import {
  Bank,
  Color,
  GameAction,
  GamePhase,
  GameState,
  Piece,
  Player,
  Size,
  System,
} from './types';
import {
  checkGameEnd,
  cloneGameState,
  createPiece,
  findSystem,
  hasOverpopulation,
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
    // Create the bank with all 36 pieces
    const bank: Bank = { pieces: [] };

    const colors: Color[] = ['yellow', 'green', 'blue', 'red'];
    const sizes: Size[] = [1, 2, 3];

    // 3 pieces of each color-size combination
    for (const color of colors) {
      for (const size of sizes) {
        for (let i = 0; i < 3; i++) {
          bank.pieces.push(createPiece(color, size));
        }
      }
    }

    return {
      phase: 'setup',
      currentPlayer: 'player1',
      turnNumber: 1,
      systems: [],
      bank,
      players: {
        player1: { homeSystemId: '' },
        player2: { homeSystemId: '' },
      },
      gameHistory: [],
    };
  }

  // Get current state (immutable copy)
  getState(): GameState {
    return cloneGameState(this.state);
  }

  // Get current player
  getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }

  // Get game phase
  getPhase(): GamePhase {
    return this.state.phase;
  }

  // Get winner (if game has ended)
  getWinner(): Player | null {
    return this.state.winner || null;
  }

  // Check if game has ended
  isGameEnded(): boolean {
    return this.state.phase === 'ended';
  }

  // Get available pieces in bank
  getBankPieces(): Piece[] {
    return [...this.state.bank.pieces];
  }

  // Get all systems (copies)
  getSystems(): System[] {
    return this.state.systems.map(system => ({ ...system }));
  }

  // Get direct reference to systems (for internal use)
  getSystemsRef(): System[] {
    return this.state.systems;
  }

  // Get a specific system by ID
  getSystem(systemId: string): System | null {
    return findSystem(this.state, systemId);
  }

  // Get player's home system
  getHomeSystem(player: Player): System | null {
    const homeSystemId = this.state.players[player].homeSystemId;
    return homeSystemId ? findSystem(this.state, homeSystemId) : null;
  }

  // Get game history
  getHistory(): GameAction[] {
    return [...this.state.gameHistory];
  }

  // Add action to history
  addActionToHistory(action: GameAction): void {
    this.state.gameHistory.push(action);
  }

  // Switch to next player
  switchPlayer(): void {
    this.state.currentPlayer =
      this.state.currentPlayer === 'player1' ? 'player2' : 'player1';
    if (this.state.currentPlayer === 'player1') {
      this.state.turnNumber++;
    }
  }

  // Set game phase
  setPhase(phase: GamePhase): void {
    this.state.phase = phase;
  }

  // Set winner and end game
  setWinner(winner: Player): void {
    this.state.winner = winner;
    this.state.phase = 'ended';
  }

  // Add a new system
  addSystem(system: System): void {
    this.state.systems.push(system);
  }

  // Remove a system
  removeSystem(systemId: string): void {
    this.state.systems = this.state.systems.filter(
      system => system.id !== systemId
    );
  }

  // Set player's home system
  setHomeSystem(player: Player, systemId: string): void {
    this.state.players[player].homeSystemId = systemId;
  }

  // Remove piece from bank
  removePieceFromBank(pieceId: string): Piece | null {
    const index = this.state.bank.pieces.findIndex(
      piece => piece.id === pieceId
    );
    if (index === -1) return null;

    const [removed] = this.state.bank.pieces.splice(index, 1);
    return removed ?? null;
  }

  // Add piece to bank
  addPieceToBank(piece: Piece): void {
    this.state.bank.pieces.push(piece);
  }

  // Add pieces to bank (for overpopulation cleanup)
  addPiecesToBank(pieces: Piece[]): void {
    this.state.bank.pieces.push(...pieces);
  }

  getOverpopulations(): { systemId: string; color: Color }[] {
    return this.state.systems
      .map(system => {
        for (const color of ['yellow', 'green', 'blue', 'red'] as Color[]) {
          if (hasOverpopulation(system, color)) {
            return { systemId: system.id, color };
          }
        }
        return null;
      })
      .filter(Boolean) as { systemId: string; color: Color }[];
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

  // Serialize state to JSON
  serialize(): string {
    return JSON.stringify(this.state);
  }

  // Deserialize state from JSON
  static deserialize(json: string): BinaryHomeworldsGameState {
    const state = JSON.parse(json) as GameState;
    return new BinaryHomeworldsGameState(state);
  }

  // Create a new game state from action history (replay)
  static fromHistory(_actions: GameAction[]): BinaryHomeworldsGameState {
    const gameState = new BinaryHomeworldsGameState();

    // This would be implemented by the GameEngine
    // For now, we'll just return the initial state
    // The GameEngine will handle replaying actions
    return gameState;
  }

  // Validate that the current state is consistent
  validateState(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that all systems have at least one star (except during setup)
    if (this.state.phase !== 'setup') {
      for (const system of this.state.systems) {
        if (system.stars.length === 0) {
          errors.push(`System ${system.id} has no stars`);
        }
      }
    }

    // Check that home systems are set after setup
    if (this.state.phase !== 'setup') {
      if (!this.state.players.player1.homeSystemId) {
        errors.push('Player 1 home system not set');
      }
      if (!this.state.players.player2.homeSystemId) {
        errors.push('Player 2 home system not set');
      }
    }

    // Check that bank + all pieces in systems = 36 pieces
    let totalPieces = this.state.bank.pieces.length;
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
