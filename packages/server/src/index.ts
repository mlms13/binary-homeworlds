import cors from '@fastify/cors';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import process from 'process'; // Import process from 'process' package
import { createClient, RedisClientType } from 'redis';
import { Server } from 'socket.io';

import type { GameAction } from '@binary-homeworlds/shared';
import type { HoverState } from '@binary-homeworlds/shared';

import { GameService } from './services/GameService.js';
import { PlayerService } from './services/PlayerService.js';
import { CreateGameRequest, JoinGameRequest } from './types.js';

dotenv.config();

// Environment configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const HOST = process.env.HOST || '0.0.0.0';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Redis client
const redis: RedisClientType = createClient({
  url: REDIS_URL,
});

// Socket.IO server
let io: Server;

// Services
let gameService: GameService;
let playerService: PlayerService;

async function startServer() {
  try {
    // Connect to Redis
    await redis.connect();
    fastify.log.info('Connected to Redis');

    // Initialize services
    gameService = new GameService(redis);
    playerService = new PlayerService(redis);

    // Register CORS
    await fastify.register(cors, {
      origin: ['http://localhost:3002', 'https://localhost:3002'],
      credentials: true,
    });

    // Health check endpoint
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // API routes

    // Get public games available to join
    fastify.get('/api/games/public', async (_request, reply) => {
      try {
        const games = await gameService.getPublicGames();
        return { games };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Failed to fetch public games' });
      }
    });

    // Get player's current games
    fastify.get('/api/games/player/:playerId', async (request, reply) => {
      try {
        const { playerId } = request.params as { playerId: string };
        const games = await gameService.getPlayerGames(playerId);
        return { games };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Failed to fetch player games' });
      }
    });

    // Create a new game
    fastify.post('/api/games', async (request, reply) => {
      try {
        const createRequest = request.body as CreateGameRequest & {
          playerId: string;
        };
        const game = await gameService.createGame(
          createRequest,
          createRequest.playerId
        );
        await playerService.addPlayerToGame(createRequest.playerId, game.id);
        return { game };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Failed to create game' });
      }
    });

    // Join a game
    fastify.post('/api/games/join', async (request, reply) => {
      try {
        const joinRequest = request.body as JoinGameRequest & {
          playerId: string;
        };
        const game = await gameService.joinGame(
          joinRequest,
          joinRequest.playerId
        );
        await playerService.addPlayerToGame(joinRequest.playerId, game.id);
        return { game };
      } catch (error) {
        fastify.log.error(error);
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        reply.status(400).send({ error: message });
      }
    });

    // Get specific game
    fastify.get('/api/games/:gameId', async (request, reply) => {
      try {
        const { gameId } = request.params as { gameId: string };
        const game = await gameService.getGame(gameId);
        if (!game) {
          reply.status(404).send({ error: 'Game not found' });
          return;
        }
        return { game };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Failed to fetch game' });
      }
    });

    // Start the server
    await fastify.listen({ port: PORT, host: HOST });

    // Initialize Socket.IO
    io = new Server(fastify.server, {
      cors: {
        origin: ['http://localhost:3002', 'https://localhost:3002'],
        credentials: true,
      },
    });

    // Socket.IO connection handling
    io.on('connection', socket => {
      fastify.log.info(`Client connected: ${socket.id}`);

      // Player authentication/registration
      socket.on(
        'register_player',
        async (data: { playerName: string; playerId?: string }) => {
          try {
            const playerSession =
              await playerService.createOrUpdatePlayerSession(
                socket.id,
                data.playerName,
                data.playerId
              );
            socket.emit('player_registered', {
              playerId: playerSession.playerId,
            });
            fastify.log.info(
              `Player registered: ${playerSession.playerName} (${playerSession.playerId})`
            );
          } catch {
            socket.emit('error', { message: 'Failed to register player' });
          }
        }
      );

      // Join a game room
      socket.on('join_game', async (data: { gameId: string }) => {
        try {
          const player = await playerService.getPlayerBySocketId(socket.id);
          if (!player) {
            socket.emit('error', { message: 'Player not registered' });
            return;
          }

          const game = await gameService.getGame(data.gameId);
          if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          // Check if player is part of this game
          const isPlayer1 = game.players.player1?.id === player.playerId;
          const isPlayer2 = game.players.player2?.id === player.playerId;

          if (!isPlayer1 && !isPlayer2) {
            socket.emit('error', {
              message: 'Not authorized to join this game',
            });
            return;
          }

          // Join the game room
          socket.join(`game:${data.gameId}`);

          // Update player online status
          await gameService.updatePlayerOnlineStatus(
            data.gameId,
            player.playerId,
            true,
            socket.id
          );

          // Notify other players in the game
          socket.to(`game:${data.gameId}`).emit('player_joined', {
            playerId: player.playerId,
            playerName: player.playerName,
          });

          socket.emit('game_joined', { gameId: data.gameId });
          fastify.log.info(
            `Player ${player.playerName} joined game ${data.gameId}`
          );
        } catch {
          socket.emit('error', { message: 'Failed to join game' });
        }
      });

      // Apply a game action
      socket.on(
        'game_action',
        async (data: { gameId: string; action: GameAction }) => {
          try {
            const player = await playerService.getPlayerBySocketId(socket.id);
            if (!player) {
              socket.emit('error', { message: 'Player not registered' });
              return;
            }

            const updatedGame = await gameService.applyAction(
              data.gameId,
              data.action
            );

            // Broadcast the action to all players in the game
            io.to(`game:${data.gameId}`).emit('game_updated', {
              game: updatedGame,
              lastAction: data.action,
            });

            fastify.log.info(
              `Action applied in game ${data.gameId}: ${data.action.type}`
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to apply action';
            socket.emit('action_error', { message });
          }
        }
      );

      // Real-time hover states for better UX
      socket.on(
        'hover_state',
        async (data: { gameId: string; hoverState: HoverState | null }) => {
          try {
            const player = await playerService.getPlayerBySocketId(socket.id);
            if (!player) return;

            if (data.hoverState) {
              await playerService.setHoverState({
                ...data.hoverState,
                gameId: data.gameId,
                playerId: player.playerId,
                timestamp: new Date().toISOString(),
              });
            } else {
              await playerService.clearHoverState(data.gameId, player.playerId);
            }

            // Broadcast hover state to other players in the game
            socket.to(`game:${data.gameId}`).emit('opponent_hover', {
              playerId: player.playerId,
              hoverState: data.hoverState,
            });
          } catch {
            // Silently fail for hover states
          }
        }
      );

      socket.on('disconnect', async () => {
        try {
          const player = await playerService.getPlayerBySocketId(socket.id);
          if (player) {
            // Update online status for all games this player is in
            for (const gameId of player.currentGames) {
              await gameService.updatePlayerOnlineStatus(
                gameId,
                player.playerId,
                false
              );

              // Notify other players
              socket.to(`game:${gameId}`).emit('player_left', {
                playerId: player.playerId,
                playerName: player.playerName,
              });
            }
          }

          fastify.log.info(`Client disconnected: ${socket.id}`);
        } catch (error) {
          fastify.log.error('Error handling disconnect:', error);
        }
      });
    });

    fastify.log.info(
      `Binary Homeworlds server running on http://${HOST}:${PORT}`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Shutting down server...');
  await redis.disconnect();
  await fastify.close();
  process.exit(0);
});

startServer();
