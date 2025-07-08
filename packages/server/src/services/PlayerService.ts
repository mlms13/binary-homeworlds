import type { RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { PlayerSession, HoverState } from '../types.js';

export class PlayerService {
  private redis: any;
  private readonly PLAYER_SESSION_PREFIX = 'player_session:';
  private readonly SOCKET_TO_PLAYER_PREFIX = 'socket_to_player:';
  private readonly HOVER_STATE_PREFIX = 'hover:';

  constructor(redis: any) {
    this.redis = redis;
  }

  async createOrUpdatePlayerSession(
    socketId: string,
    playerName: string,
    existingPlayerId?: string
  ): Promise<PlayerSession> {
    const playerId = existingPlayerId || uuidv4();
    const now = new Date().toISOString();

    const playerSession: PlayerSession = {
      playerId,
      playerName,
      socketId,
      currentGames: [],
      lastActivity: now,
    };

    // Store player session
    await this.redis.setEx(
      `${this.PLAYER_SESSION_PREFIX}${playerId}`,
      3600 * 24, // 24 hours
      JSON.stringify(playerSession)
    );

    // Store socket to player mapping
    await this.redis.setEx(
      `${this.SOCKET_TO_PLAYER_PREFIX}${socketId}`,
      3600 * 24,
      playerId
    );

    return playerSession;
  }

  async getPlayerBySocketId(socketId: string): Promise<PlayerSession | null> {
    const playerId = await this.redis.get(
      `${this.SOCKET_TO_PLAYER_PREFIX}${socketId}`
    );
    if (!playerId) {
      return null;
    }

    return this.getPlayer(playerId);
  }

  async getPlayer(playerId: string): Promise<PlayerSession | null> {
    const sessionData = await this.redis.get(
      `${this.PLAYER_SESSION_PREFIX}${playerId}`
    );
    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData);
  }

  async updatePlayerActivity(playerId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (player) {
      player.lastActivity = new Date().toISOString();
      await this.redis.setEx(
        `${this.PLAYER_SESSION_PREFIX}${playerId}`,
        3600 * 24,
        JSON.stringify(player)
      );
    }
  }

  async addPlayerToGame(playerId: string, gameId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (player) {
      if (!player.currentGames.includes(gameId)) {
        player.currentGames.push(gameId);
        await this.redis.setEx(
          `${this.PLAYER_SESSION_PREFIX}${playerId}`,
          3600 * 24,
          JSON.stringify(player)
        );
      }
    }
  }

  async removePlayerFromGame(playerId: string, gameId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (player) {
      player.currentGames = player.currentGames.filter(id => id !== gameId);
      await this.redis.setEx(
        `${this.PLAYER_SESSION_PREFIX}${playerId}`,
        3600 * 24,
        JSON.stringify(player)
      );
    }
  }

  async updateSocketId(playerId: string, newSocketId: string): Promise<void> {
    const player = await this.getPlayer(playerId);
    if (player) {
      // Remove old socket mapping
      await this.redis.del(`${this.SOCKET_TO_PLAYER_PREFIX}${player.socketId}`);

      // Update player session
      player.socketId = newSocketId;
      player.lastActivity = new Date().toISOString();

      await this.redis.setEx(
        `${this.PLAYER_SESSION_PREFIX}${playerId}`,
        3600 * 24,
        JSON.stringify(player)
      );

      // Add new socket mapping
      await this.redis.setEx(
        `${this.SOCKET_TO_PLAYER_PREFIX}${newSocketId}`,
        3600 * 24,
        playerId
      );
    }
  }

  async removePlayerSession(socketId: string): Promise<void> {
    const playerId = await this.redis.get(
      `${this.SOCKET_TO_PLAYER_PREFIX}${socketId}`
    );
    if (playerId) {
      await this.redis.del(`${this.PLAYER_SESSION_PREFIX}${playerId}`);
      await this.redis.del(`${this.SOCKET_TO_PLAYER_PREFIX}${socketId}`);
    }
  }

  // Hover state management for real-time features
  async setHoverState(hoverState: HoverState): Promise<void> {
    const key = `${this.HOVER_STATE_PREFIX}${hoverState.gameId}:${hoverState.playerId}`;
    await this.redis.setEx(key, 10, JSON.stringify(hoverState)); // 10 second expiry
  }

  async getHoverState(
    gameId: string,
    playerId: string
  ): Promise<HoverState | null> {
    const key = `${this.HOVER_STATE_PREFIX}${gameId}:${playerId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async clearHoverState(gameId: string, playerId: string): Promise<void> {
    const key = `${this.HOVER_STATE_PREFIX}${gameId}:${playerId}`;
    await this.redis.del(key);
  }

  async getAllHoverStates(gameId: string): Promise<HoverState[]> {
    const pattern = `${this.HOVER_STATE_PREFIX}${gameId}:*`;
    const keys = await this.redis.keys(pattern);
    const hoverStates: HoverState[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        hoverStates.push(JSON.parse(data));
      }
    }

    return hoverStates;
  }
}
