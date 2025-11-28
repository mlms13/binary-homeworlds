import { Player } from '@binary-homeworlds/engine';
import type { GameAction } from '@binary-homeworlds/shared';

export interface GameSession {
  id: string;
  type: 'local' | 'public' | 'private';
  status: 'waiting' | 'active' | 'completed';
  players: {
    player1?: PlayerInfo;
    player2?: PlayerInfo;
  };
  currentPlayer: Player.Player;
  actions: Array<GameAction>;
  createdAt: string;
  updatedAt: string;
  privateCode?: string; // For private games
}

export interface PlayerInfo {
  id: string;
  name: string;
  socketId?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface CreateGameRequest {
  type: 'local' | 'public' | 'private';
  playerName: string;
}

export interface JoinGameRequest {
  gameId: string;
  playerName: string;
  privateCode?: string; // Required for private games
}

export interface GameListItem {
  id: string;
  type: 'public' | 'private';
  status: 'waiting' | 'active' | 'completed';
  players: {
    player1?: { name: string };
    player2?: { name: string };
  };
  currentPlayer: Player.Player;
  createdAt: string;
}

export interface PlayerSession {
  playerId: string; // Unique user/session identifier (UUID)
  playerName: string;
  socketId: string;
  currentGames: Array<string>; // Array of game IDs
  lastActivity: string;
}
