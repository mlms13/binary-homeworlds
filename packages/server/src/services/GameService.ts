import type { RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';

import type { GameAction } from '@binary-homeworlds/shared';
import { GameEngine } from '@binary-homeworlds/shared';

import {
  CreateGameRequest,
  GameListItem,
  GameSession,
  JoinGameRequest,
  PlayerInfo,
} from '../types.js';

export class GameService {
  private redis: RedisClientType;
  private readonly GAME_PREFIX = 'game:';
  private readonly PLAYER_PREFIX = 'player:';
  private readonly PUBLIC_GAMES_SET = 'public_games';
  private readonly PRIVATE_CODES_PREFIX = 'private_code:';

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  // Generate a short, readable code for private games
  private generatePrivateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createGame(
    request: CreateGameRequest,
    playerId: string
  ): Promise<GameSession> {
    const gameId = uuidv4();
    const now = new Date().toISOString();

    const player1: PlayerInfo = {
      id: playerId,
      name: request.playerName,
      isOnline: true,
      lastSeen: now,
    };

    let privateCode: string | undefined;
    if (request.type === 'private') {
      privateCode = this.generatePrivateCode();
      // Store the mapping from private code to game ID
      await this.redis.setEx(
        `${this.PRIVATE_CODES_PREFIX}${privateCode}`,
        3600 * 24,
        gameId
      ); // 24 hour expiry
    }

    // For local games, create both players immediately
    const player2: PlayerInfo | undefined =
      request.type === 'local'
        ? {
            id: `${playerId}_player2`, // Create a unique ID for player 2
            name: 'Player 2',
            isOnline: true,
            lastSeen: now,
          }
        : undefined;

    const gameSession: GameSession = {
      id: gameId,
      type: request.type,
      status: request.type === 'local' ? 'active' : 'waiting', // Local games start immediately
      players: {
        player1,
        ...(player2 && { player2 }),
      },
      currentPlayer: 'player1',
      actions: [],
      createdAt: now,
      updatedAt: now,
      privateCode,
    };

    // Store the game
    await this.redis.setEx(
      `${this.GAME_PREFIX}${gameId}`,
      3600 * 24 * 7, // 7 days expiry
      JSON.stringify(gameSession)
    );

    // Add to public games list if public
    if (request.type === 'public') {
      await this.redis.sAdd(this.PUBLIC_GAMES_SET, gameId);
    }

    return gameSession;
  }

  async joinGame(
    request: JoinGameRequest,
    playerId: string
  ): Promise<GameSession> {
    let gameId = request.gameId;

    // If joining by private code, resolve the game ID
    if (request.privateCode) {
      const resolvedGameId = await this.redis.get(
        `${this.PRIVATE_CODES_PREFIX}${request.privateCode}`
      );
      if (!resolvedGameId) {
        throw new Error('Invalid private code');
      }
      gameId = resolvedGameId;
    }

    const gameData = await this.redis.get(`${this.GAME_PREFIX}${gameId}`);
    if (!gameData) {
      throw new Error('Game not found');
    }

    const gameSession: GameSession = JSON.parse(gameData);

    // Check if game is joinable
    if (gameSession.status !== 'waiting') {
      throw new Error('Game is not available for joining');
    }

    if (gameSession.players.player2) {
      throw new Error('Game is already full');
    }

    // For private games, verify the code matches
    if (
      gameSession.type === 'private' &&
      gameSession.privateCode !== request.privateCode
    ) {
      throw new Error('Invalid private code');
    }

    // Add player 2
    const now = new Date().toISOString();
    gameSession.players.player2 = {
      id: playerId,
      name: request.playerName,
      isOnline: true,
      lastSeen: now,
    };

    gameSession.status = 'active';
    gameSession.updatedAt = now;

    // Update the game
    await this.redis.setEx(
      `${this.GAME_PREFIX}${gameId}`,
      3600 * 24 * 7,
      JSON.stringify(gameSession)
    );

    // Remove from public games list since it's now full
    if (gameSession.type === 'public') {
      await this.redis.sRem(this.PUBLIC_GAMES_SET, gameId);
    }

    return gameSession;
  }

  async getGame(gameId: string): Promise<GameSession | null> {
    const gameData = await this.redis.get(`${this.GAME_PREFIX}${gameId}`);
    if (!gameData) {
      return null;
    }
    return JSON.parse(gameData);
  }

  async updateGame(gameSession: GameSession): Promise<void> {
    gameSession.updatedAt = new Date().toISOString();
    await this.redis.setEx(
      `${this.GAME_PREFIX}${gameSession.id}`,
      3600 * 24 * 7,
      JSON.stringify(gameSession)
    );
  }

  async applyAction(gameId: string, action: GameAction): Promise<GameSession> {
    const gameSession = await this.getGame(gameId);
    if (!gameSession) {
      throw new Error('Game not found');
    }

    if (gameSession.status !== 'active') {
      throw new Error('Game is not active');
    }

    // Validate that it's the correct player's turn
    if (action.player !== gameSession.currentPlayer) {
      throw new Error('Not your turn');
    }

    // Apply the action using the game engine
    const engine = new GameEngine();

    // Replay all previous actions
    for (const prevAction of gameSession.actions) {
      engine.applyAction(prevAction);
    }

    // Apply the new action
    const result = engine.applyAction(action);
    if (!result.valid) {
      throw new Error(`Invalid action: ${result.error}`);
    }

    // Update the game session
    gameSession.actions.push(action);

    // Check if game is over
    const gameState = engine.getGameState();
    if (gameState.isGameEnded()) {
      gameSession.status = 'completed';
    } else {
      // Switch turns (for most actions)
      gameSession.currentPlayer =
        gameSession.currentPlayer === 'player1' ? 'player2' : 'player1';
    }

    await this.updateGame(gameSession);
    return gameSession;
  }

  async getPublicGames(): Promise<Array<GameListItem>> {
    const gameIds = await this.redis.sMembers(this.PUBLIC_GAMES_SET);
    const games: Array<GameListItem> = [];

    for (const gameId of gameIds) {
      const gameSession = await this.getGame(gameId);
      if (gameSession && gameSession.status === 'waiting') {
        games.push({
          id: gameSession.id,
          type: gameSession.type as 'public',
          status: gameSession.status,
          players: {
            player1: gameSession.players.player1
              ? { name: gameSession.players.player1.name }
              : undefined,
            player2: gameSession.players.player2
              ? { name: gameSession.players.player2.name }
              : undefined,
          },
          currentPlayer: gameSession.currentPlayer,
          createdAt: gameSession.createdAt,
        });
      }
    }

    return games.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPlayerGames(playerId: string): Promise<Array<GameListItem>> {
    // This is a simplified implementation - in production, you'd want to maintain
    // an index of player -> games for better performance
    const allKeys = await this.redis.keys(`${this.GAME_PREFIX}*`);
    const games: Array<GameListItem> = [];

    for (const key of allKeys) {
      const gameData = await this.redis.get(key);
      if (gameData) {
        const gameSession: GameSession = JSON.parse(gameData);

        // Check if player is in this game
        const isPlayer1 = gameSession.players.player1?.id === playerId;
        const isPlayer2 = gameSession.players.player2?.id === playerId;

        if (isPlayer1 || isPlayer2) {
          games.push({
            id: gameSession.id,
            type: gameSession.type as 'public' | 'private',
            status: gameSession.status,
            players: {
              player1: gameSession.players.player1
                ? { name: gameSession.players.player1.name }
                : undefined,
              player2: gameSession.players.player2
                ? { name: gameSession.players.player2.name }
                : undefined,
            },
            currentPlayer: gameSession.currentPlayer,
            createdAt: gameSession.createdAt,
          });
        }
      }
    }

    return games.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updatePlayerOnlineStatus(
    gameId: string,
    playerId: string,
    isOnline: boolean,
    socketId?: string
  ): Promise<void> {
    const gameSession = await this.getGame(gameId);
    if (!gameSession) {
      return;
    }

    const now = new Date().toISOString();

    if (gameSession.players.player1?.id === playerId) {
      gameSession.players.player1.isOnline = isOnline;
      gameSession.players.player1.lastSeen = now;
      if (socketId) gameSession.players.player1.socketId = socketId;
    } else if (gameSession.players.player2?.id === playerId) {
      gameSession.players.player2.isOnline = isOnline;
      gameSession.players.player2.lastSeen = now;
      if (socketId) gameSession.players.player2.socketId = socketId;
    }

    await this.updateGame(gameSession);
  }
}
