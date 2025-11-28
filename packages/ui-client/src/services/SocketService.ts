import { io, Socket } from 'socket.io-client';

import { GameAction, HoverState } from '@binary-homeworlds/shared';

export interface GameSession {
  id: string;
  type: 'local' | 'public' | 'private';
  status: 'waiting' | 'active' | 'completed';
  players: {
    player1?: { id: string; name: string; isOnline: boolean };
    player2?: { id: string; name: string; isOnline: boolean };
  };
  currentPlayer: 'player1' | 'player2';
  actions: Array<GameAction>;
  createdAt: string;
  updatedAt: string;
  privateCode?: string;
}

export interface GameListItem {
  id: string;
  type: 'public' | 'private';
  status: 'waiting' | 'active' | 'completed';
  players: {
    player1?: { name: string };
    player2?: { name: string };
  };
  currentPlayer: 'player1' | 'player2';
  createdAt: string;
}

export class SocketService {
  private socket: Socket | null = null;
  private playerId: string | null = null;
  private playerName: string | null = null;
  private currentGameId: string | null = null;

  // Event callbacks
  private onGameUpdated:
    | ((data: { game: GameSession; lastAction: GameAction }) => void)
    | null = null;
  private onPlayerJoined:
    | ((data: { playerId: string; playerName: string }) => void)
    | null = null;
  private onPlayerLeft:
    | ((data: { playerId: string; playerName: string }) => void)
    | null = null;
  private onOpponentHover:
    | ((data: { playerId: string; hoverState: HoverState | null }) => void)
    | null = null;
  private onActionError: ((data: { message: string }) => void) | null = null;
  private onError: ((data: { message: string }) => void) | null = null;

  constructor() {
    this.loadPlayerData();
  }

  private loadPlayerData() {
    this.playerId = localStorage.getItem('playerId');
    this.playerName = localStorage.getItem('playerName');
  }

  private savePlayerData() {
    if (this.playerId) localStorage.setItem('playerId', this.playerId);
    if (this.playerName) localStorage.setItem('playerName', this.playerName);
  }

  connect(serverUrl?: string): Promise<void> {
    // Vite exposes env variables via import.meta.env
    // TypeScript needs a declaration for import.meta.env
    const url =
      serverUrl ||
      (typeof import.meta.env !== 'undefined'
        ? import.meta.env.VITE_SERVER_URL
        : undefined) ||
      'http://localhost:3001';
    return new Promise((resolve, reject) => {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.setupEventHandlers();
        resolve();
      });

      this.socket.on('connect_error', error => {
        console.error('Connection error:', error);
        reject(error);
      });
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('player_registered', (data: { playerId: string }) => {
      this.playerId = data.playerId;
      this.savePlayerData();
      console.log('Player registered:', data.playerId);
    });

    this.socket.on('game_joined', (data: { gameId: string }) => {
      this.currentGameId = data.gameId;
      console.log('Joined game:', data.gameId);
    });

    this.socket.on(
      'game_updated',
      (data: { game: GameSession; lastAction: GameAction }) => {
        if (this.onGameUpdated) {
          this.onGameUpdated(data);
        }
      }
    );

    this.socket.on(
      'player_joined',
      (data: { playerId: string; playerName: string }) => {
        if (this.onPlayerJoined) {
          this.onPlayerJoined(data);
        }
      }
    );

    this.socket.on(
      'player_left',
      (data: { playerId: string; playerName: string }) => {
        if (this.onPlayerLeft) {
          this.onPlayerLeft(data);
        }
      }
    );

    this.socket.on(
      'opponent_hover',
      (data: { playerId: string; hoverState: HoverState | null }) => {
        if (this.onOpponentHover) {
          this.onOpponentHover(data);
        }
      }
    );

    this.socket.on('action_error', (data: { message: string }) => {
      if (this.onActionError) {
        this.onActionError(data);
      }
    });

    this.socket.on('error', (data: { message: string }) => {
      if (this.onError) {
        this.onError(data);
      }
    });
  }

  async registerPlayer(playerName: string): Promise<void> {
    if (!this.socket) throw new Error('Not connected to server');
    this.playerName = playerName;
    this.savePlayerData();

    return new Promise((resolve, reject) => {
      (this.socket as Socket).emit('register_player', {
        playerName,
        playerId: this.playerId,
      });

      const timeout = setTimeout(() => {
        reject(new Error('Registration timeout'));
      }, 5000);

      this.socket!.once('player_registered', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket!.once('error', error => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });
    });
  }

  async joinGame(gameId: string): Promise<void> {
    if (!this.socket) throw new Error('Not connected to server');

    return new Promise((resolve, reject) => {
      this.socket!.emit('join_game', { gameId });

      const timeout = setTimeout(() => {
        reject(new Error('Join game timeout'));
      }, 5000);

      this.socket!.once('game_joined', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket!.once('error', error => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });
    });
  }

  sendGameAction(action: GameAction): void {
    if (!this.socket || !this.currentGameId) {
      throw new Error('Not connected to a game');
    }

    this.socket.emit('game_action', {
      gameId: this.currentGameId,
      action,
    });
  }

  sendHoverState(hoverState: HoverState | null): void {
    if (!this.socket || !this.currentGameId) return;

    this.socket.emit('hover_state', {
      gameId: this.currentGameId,
      hoverState,
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentGameId = null;
  }

  // Event handler setters
  setOnGameUpdated(
    callback: (data: { game: GameSession; lastAction: GameAction }) => void
  ) {
    this.onGameUpdated = callback;
  }

  setOnPlayerJoined(
    callback: (data: { playerId: string; playerName: string }) => void
  ) {
    this.onPlayerJoined = callback;
  }

  setOnPlayerLeft(
    callback: (data: { playerId: string; playerName: string }) => void
  ) {
    this.onPlayerLeft = callback;
  }

  setOnOpponentHover(
    callback: (data: {
      playerId: string;
      hoverState: HoverState | null;
    }) => void
  ) {
    this.onOpponentHover = callback;
  }

  setOnActionError(callback: (data: { message: string }) => void) {
    this.onActionError = callback;
  }

  setOnError(callback: (data: { message: string }) => void) {
    this.onError = callback;
  }

  // Getters
  getPlayerId(): string | null {
    return this.playerId;
  }

  getPlayerName(): string | null {
    return this.playerName;
  }

  getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
