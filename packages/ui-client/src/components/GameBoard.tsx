import { useState, useEffect, useCallback } from 'react';
import { GameEngine } from '@binary-homeworlds/shared';
import { GameAction, Player } from '@binary-homeworlds/shared';

import { SocketService, GameSession } from '../services/SocketService';
import { ApiService } from '../services/ApiService';
import { useGameActions } from '../hooks/useGameActions';
import Bank from './Bank';
import HomeSystem from './HomeSystem';
import StarSystem from './StarSystem';
import ActionLog from './ActionLog';
import './GameBoard.css';

interface GameBoardProps {
  gameId: string;
  socketService: SocketService;
  apiService: ApiService;
  onBackToLobby: () => void;
}

export default function GameBoard({ gameId, socketService, apiService, onBackToLobby }: GameBoardProps) {
  const [gameEngine, setGameEngine] = useState<GameEngine>(new GameEngine());
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogVisible, setIsLogVisible] = useState(false);

  const gameState = gameEngine.getGameState();
  const state = gameState.getState();
  const currentPlayer = state.currentPlayer;
  const playerId = socketService.getPlayerId();

  // Determine which player role the current user has
  const getPlayerRole = useCallback((): Player | null => {
    if (!gameSession || !playerId) return null;
    if (gameSession.players.player1?.id === playerId) return 'player1';
    if (gameSession.players.player2?.id === playerId) return 'player2';
    return null;
  }, [gameSession, playerId]);

  const playerRole = getPlayerRole();
  const isLocalGame = gameSession?.type === 'local';

  // Load initial game data
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const game = await apiService.getGame(gameId);
        setGameSession(game);

        // Reconstruct game state from actions
        if (game.actions.length > 0) {
          const engine = GameEngine.fromHistory(game.actions);
          setGameEngine(engine);
        }

        // Join the game room for real-time updates
        if (!isLocalGame) {
          await socketService.joinGame(gameId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId, apiService, socketService, isLocalGame]);

  // Set up Socket.IO event handlers
  useEffect(() => {
    if (isLocalGame) return;

    const handleGameUpdated = (data: { game: GameSession; lastAction: GameAction }) => {
      setGameSession(data.game);

      // Reconstruct game state from actions
      if (data.game.actions.length > 0) {
        const engine = GameEngine.fromHistory(data.game.actions);
        setGameEngine(engine);
      }
    };

    const handleOpponentHover = (data: { playerId: string; hoverState: any }) => {
      if (data.playerId !== playerId) {
        // Handle opponent hover state if needed
        console.log('Opponent hover:', data.hoverState);
      }
    };

    const handleActionError = (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    };

    socketService.setOnGameUpdated(handleGameUpdated);
    socketService.setOnOpponentHover(handleOpponentHover);
    socketService.setOnActionError(handleActionError);

    return () => {
      socketService.setOnGameUpdated(() => {});
      socketService.setOnOpponentHover(() => {});
      socketService.setOnActionError(() => {});
    };
  }, [socketService, playerId, isLocalGame]);

  const { actionHistory, applyAction: applyActionToEngine, getAvailableActions } = useGameActions(gameEngine);

  const applyAction = useCallback((action: GameAction) => {
    try {
      if (isLocalGame) {
        // For local games, apply directly
        const result = applyActionToEngine(action);
        if (!result.valid) {
          setError(result.error || 'Invalid action');
        } else {
          setGameEngine(new GameEngine(gameEngine.getGameState()));
        }
        return result;
      } else {
        // For multiplayer games, send to server
        socketService.sendGameAction(action);
        return { valid: true };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply action');
      return { valid: false, error: err instanceof Error ? err.message : 'Failed to apply action' };
    }
  }, [gameEngine, socketService, isLocalGame, applyActionToEngine]);



  if (loading) {
    return (
      <div className="game-board loading">
        <div className="loading-message">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-board error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={onBackToLobby}>Back to Lobby</button>
        </div>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="game-board error">
        <div className="error-message">
          <h3>Game Not Found</h3>
          <button onClick={onBackToLobby}>Back to Lobby</button>
        </div>
      </div>
    );
  }

  const getPlayerDisplayName = (player: Player) => {
    if (isLocalGame) {
      return player === 'player1' ? 'Player 1' : 'Player 2';
    }

    if (playerRole === player) {
      return 'You';
    }

    const playerInfo = gameSession.players[player];
    return playerInfo?.name || 'Waiting...';
  };

  const player1Home = gameState.getHomeSystem('player1');
  const player2Home = gameState.getHomeSystem('player2');

  return (
    <div className="game-board">
      <div className="game-header">
        <button className="back-button" onClick={onBackToLobby}>
          ← Back to Lobby
        </button>

        <div className="game-info">
          <div className="players">
            {getPlayerDisplayName('player1')} vs {getPlayerDisplayName('player2')}
          </div>
          {!isLocalGame && gameSession && (
            <div className="game-type">
              {gameSession.type === 'private' ? `Private Game (${gameSession.privateCode})` : 'Public Game'}
            </div>
          )}
        </div>

        <div className="game-controls">
          <button
            className="log-button"
            onClick={() => setIsLogVisible(!isLogVisible)}
          >
            Action Log
          </button>
        </div>
      </div>

      <div className="current-turn">
        <div className="turn-indicator">
          {state.phase === 'setup'
            ? `${getPlayerDisplayName(currentPlayer)}'s turn to set up`
            : `${getPlayerDisplayName(currentPlayer)}'s turn`
          }
        </div>
      </div>

      <div className="main-area">
        <div className="bank-container">
          <Bank
            pieces={state.bank.pieces}
            selectedPieces={[]}
            onPieceClick={() => {}}
          />
        </div>

        <div className="play-area">
          <div className="top-area">
            {player2Home && (
              <div className="opponent-home">
                <HomeSystem
                  system={player2Home}
                  isCurrentPlayer={currentPlayer === 'player2'}
                  isOpponent={playerRole === 'player1'}
                  onAction={applyAction}
                  getAvailableActions={getAvailableActions}
                  bankPieces={state.bank.pieces}
                  currentPlayer={currentPlayer}
                />
              </div>
            )}
          </div>

          <div className="systems-grid">
            {state.systems
              .filter(system =>
                system.id !== state.players.player1.homeSystemId &&
                system.id !== state.players.player2.homeSystemId
              )
              .map(system => (
                <StarSystem
                  key={system.id}
                  system={system}
                  onAction={applyAction}
                  getAvailableActions={getAvailableActions}
                  bankPieces={state.bank.pieces}
                  currentPlayer={currentPlayer}
                />
              ))}
          </div>

          <div className="bottom-area">
            {player1Home && (
              <HomeSystem
                system={player1Home}
                isCurrentPlayer={currentPlayer === 'player1'}
                isOpponent={playerRole === 'player2'}
                onAction={applyAction}
                getAvailableActions={getAvailableActions}
                bankPieces={state.bank.pieces}
                currentPlayer={currentPlayer}
              />
            )}
          </div>
        </div>
      </div>

      {isLogVisible && (
        <ActionLog
          actions={actionHistory}
          onClose={() => setIsLogVisible(false)}
          getPlayerDisplayName={getPlayerDisplayName}
        />
      )}
    </div>
  );
}
