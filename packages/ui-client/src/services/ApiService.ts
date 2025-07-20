import { GameListItem, GameSession } from './SocketService.js';

export interface CreateGameRequest {
  type: 'local' | 'public' | 'private';
  playerName: string;
  playerId: string;
}

export interface JoinGameRequest {
  gameId: string;
  playerName: string;
  playerId: string;
  privateCode?: string;
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getPublicGames(): Promise<GameListItem[]> {
    const response = await this.request<{ games: GameListItem[] }>(
      '/api/games/public'
    );
    return response.games;
  }

  async getPlayerGames(playerId: string): Promise<GameListItem[]> {
    const response = await this.request<{ games: GameListItem[] }>(
      `/api/games/player/${playerId}`
    );
    return response.games;
  }

  async createGame(request: CreateGameRequest): Promise<GameSession> {
    const response = await this.request<{ game: GameSession }>('/api/games', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.game;
  }

  async joinGame(request: JoinGameRequest): Promise<GameSession> {
    const response = await this.request<{ game: GameSession }>(
      '/api/games/join',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    return response.game;
  }

  async getGame(gameId: string): Promise<GameSession> {
    const response = await this.request<{ game: GameSession }>(
      `/api/games/${gameId}`
    );
    return response.game;
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}
