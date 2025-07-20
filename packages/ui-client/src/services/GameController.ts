import {
  GameAction,
  GameEngine,
  HoverState,
  Player,
} from '@binary-homeworlds/shared';

import { ApiService } from './ApiService.js';
import { GameSession, SocketService } from './SocketService.js';

export interface GameControllerCallbacks {
  onGameUpdated: (gameSession: GameSession, gameEngine: GameEngine) => void;
  onError: (error: string) => void;
  onOpponentHover?: (hoverState: HoverState | null) => void;
}

export interface GameControllerInterface {
  loadGame(gameId: string): Promise<void>;
  applyAction(action: GameAction): Promise<{ valid: boolean; error?: string }>;
  getPlayerRole(): Player | null;
  getPlayerDisplayName(player: Player): string;
  isLocalGame(): boolean;
  cleanup(): void;
}

export class GameController implements GameControllerInterface {
  private gameEngine: GameEngine;
  private gameSession: GameSession | null = null;
  private apiService: ApiService;
  private socketService: SocketService;
  private callbacks: GameControllerCallbacks;
  private isLocal: boolean = false;

  constructor(
    apiService: ApiService,
    socketService: SocketService,
    callbacks: GameControllerCallbacks
  ) {
    this.apiService = apiService;
    this.socketService = socketService;
    this.callbacks = callbacks;
    this.gameEngine = new GameEngine();
  }

  async loadGame(gameId: string): Promise<void> {
    try {
      const game = await this.apiService.getGame(gameId);
      this.gameSession = game;
      this.isLocal = game.type === 'local';

      // Reconstruct game state from actions
      if (game.actions.length > 0) {
        this.gameEngine = GameEngine.fromHistory(game.actions);
      }

      // Set up real-time updates for server games
      if (!this.isLocal) {
        await this.socketService.joinGame(gameId);
        this.setupSocketHandlers();
      }

      this.callbacks.onGameUpdated(game, this.gameEngine);
    } catch (err) {
      this.callbacks.onError(
        err instanceof Error ? err.message : 'Failed to load game'
      );
    }
  }

  async applyAction(
    action: GameAction
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      if (this.isLocal) {
        // For local games, apply directly to engine
        const result = this.gameEngine.applyAction(action);
        if (result.valid) {
          // Update the game session with the new action
          if (this.gameSession) {
            this.gameSession.actions.push(action);
            this.gameSession.currentPlayer =
              this.gameSession.currentPlayer === 'player1'
                ? 'player2'
                : 'player1';
          }
          this.callbacks.onGameUpdated(this.gameSession!, this.gameEngine);
        }
        return result;
      } else {
        // For server games, send to server
        this.socketService.sendGameAction(action);
        return { valid: true };
      }
    } catch (err) {
      const error =
        err instanceof Error ? err.message : 'Failed to apply action';
      this.callbacks.onError(error);
      return { valid: false, error };
    }
  }

  getPlayerRole(): Player | null {
    if (this.isLocal) {
      // For local games, we don't need a specific player role
      return null;
    }

    if (!this.gameSession) return null;

    const playerId = this.socketService.getPlayerId();
    if (!playerId) return null;

    if (this.gameSession.players.player1?.id === playerId) return 'player1';
    if (this.gameSession.players.player2?.id === playerId) return 'player2';
    return null;
  }

  getPlayerDisplayName(player: Player): string {
    if (this.isLocal) {
      return player === 'player1' ? 'Player 1' : 'Player 2';
    }

    const playerRole = this.getPlayerRole();
    if (playerRole === player) {
      return 'You';
    }

    const playerInfo = this.gameSession?.players[player];
    return playerInfo?.name || 'Waiting...';
  }

  isLocalGame(): boolean {
    return this.isLocal;
  }

  getGameSession(): GameSession | null {
    return this.gameSession;
  }

  getGameEngine(): GameEngine {
    return this.gameEngine;
  }

  private setupSocketHandlers(): void {
    const handleGameUpdated = (data: {
      game: GameSession;
      lastAction: GameAction;
    }) => {
      this.gameSession = data.game;

      // Reconstruct game state from actions
      if (data.game.actions.length > 0) {
        this.gameEngine = GameEngine.fromHistory(data.game.actions);
      }

      this.callbacks.onGameUpdated(data.game, this.gameEngine);
    };

    const handleOpponentHover = (data: {
      playerId: string;
      hoverState: HoverState | null;
    }) => {
      const playerId = this.socketService.getPlayerId();
      if (data.playerId !== playerId && this.callbacks.onOpponentHover) {
        this.callbacks.onOpponentHover(data.hoverState);
      }
    };

    const handleActionError = (data: { message: string }) => {
      this.callbacks.onError(data.message);
    };

    this.socketService.setOnGameUpdated(handleGameUpdated);
    this.socketService.setOnOpponentHover(handleOpponentHover);
    this.socketService.setOnActionError(handleActionError);
  }

  cleanup(): void {
    if (!this.isLocal) {
      this.socketService.setOnGameUpdated(() => {});
      this.socketService.setOnOpponentHover(() => {});
      this.socketService.setOnActionError(() => {});
    }
  }
}
