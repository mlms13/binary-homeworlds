import { useCallback, useEffect, useState } from 'react';

import './GameLobby.css';

import { ApiService } from '../services/ApiService.js';
import { GameListItem, SocketService } from '../services/SocketService.js';

interface GameLobbyProps {
  apiService: ApiService;
  socketService: SocketService;
  onGameSelected: (gameId: string) => void;
}

export default function GameLobby({
  apiService,
  socketService,
  onGameSelected,
}: GameLobbyProps) {
  const [playerName, setPlayerName] = useState(
    socketService.getPlayerName() || ''
  );
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentGames, setCurrentGames] = useState<Array<GameListItem>>([]);
  const [publicGames, setPublicGames] = useState<Array<GameListItem>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [privateCode, setPrivateCode] = useState('');

  const loadGames = useCallback(async () => {
    const playerId = socketService.getPlayerId();
    if (!playerId) return;

    try {
      const [currentGamesData, publicGamesData] = await Promise.all([
        apiService.getPlayerGames(playerId),
        apiService.getPublicGames(),
      ]);

      setCurrentGames(currentGamesData);
      setPublicGames(publicGamesData);
    } catch (err) {
      console.error('Failed to load games:', err);
      setError('Failed to load games');
    }
  }, [socketService, apiService]);

  useEffect(() => {
    if (socketService.isConnected() && socketService.getPlayerId()) {
      setIsRegistered(true);
      loadGames();
    }
  }, [socketService, loadGames]);

  const handleRegister = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await socketService.registerPlayer(playerName.trim());
      setIsRegistered(true);
      await loadGames();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (type: 'local' | 'public' | 'private') => {
    const playerId = socketService.getPlayerId();
    if (!playerId || !playerName) return;

    setLoading(true);
    setError(null);

    try {
      const game = await apiService.createGame({
        type,
        playerName,
        playerId,
      });

      if (type === 'local') {
        // For local games, go directly to the game
        onGameSelected(game.id);
      } else {
        // For multiplayer games, refresh the games list
        await loadGames();
        setShowCreateGame(false);

        if (type === 'private' && game.privateCode) {
          alert(
            `Private game created! Share this code with your opponent: ${game.privateCode}`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string, privateCode?: string) => {
    const playerId = socketService.getPlayerId();
    if (!playerId || !playerName) return;

    setLoading(true);
    setError(null);

    try {
      await apiService.joinGame({
        gameId,
        playerName,
        playerId,
        privateCode,
      });

      onGameSelected(gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPrivateGame = async () => {
    if (!privateCode.trim()) {
      setError('Please enter a private game code');
      return;
    }

    await handleJoinGame('', privateCode.trim().toUpperCase());
    setShowJoinPrivate(false);
    setPrivateCode('');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getPlayerRole = (game: GameListItem, _playerId: string) => {
    if (game.players.player1?.name && game.players.player1.name === playerName)
      return 'player1';
    if (game.players.player2?.name && game.players.player2.name === playerName)
      return 'player2';
    return null;
  };

  const isPlayerTurn = (game: GameListItem, playerId: string) => {
    const role = getPlayerRole(game, playerId);
    return role === game.currentPlayer;
  };

  if (!isRegistered) {
    return (
      <div className="game-lobby">
        <div className="welcome-screen">
          <h1>Binary Homeworlds</h1>
          <div className="player-registration">
            <h2>Enter your name to start playing</h2>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              onKeyPress={e => e.key === 'Enter' && handleRegister()}
            />
            <button
              onClick={handleRegister}
              disabled={loading || !playerName.trim()}
            >
              {loading ? 'Connecting...' : 'Start Playing'}
            </button>
            {error && <div className="error">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-lobby">
      <header className="lobby-header">
        <h1>Binary Homeworlds</h1>
        <div className="player-info">Welcome, {playerName}!</div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="lobby-content">
        <section className="current-games">
          <h2>Your Games</h2>
          {currentGames.length === 0 ? (
            <p className="no-games">No active games</p>
          ) : (
            <div className="games-list">
              {currentGames.map(game => {
                const playerId = socketService.getPlayerId()!;
                const isYourTurn = isPlayerTurn(game, playerId);

                return (
                  <div
                    key={game.id}
                    className={`game-item ${isYourTurn ? 'your-turn' : ''}`}
                    onClick={() => onGameSelected(game.id)}
                  >
                    <div className="game-info">
                      <div className="game-players">
                        {game.players.player1?.name || 'Waiting...'} vs{' '}
                        {game.players.player2?.name || 'Waiting...'}
                      </div>
                      <div className="game-meta">
                        <span className={`game-status ${game.status}`}>
                          {game.status}
                        </span>
                        <span className="game-type">{game.type}</span>
                        <span className="game-time">
                          {formatTimeAgo(game.createdAt)}
                        </span>
                      </div>
                    </div>
                    {isYourTurn && (
                      <div className="turn-indicator">Your turn!</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="game-actions">
          <h2>Start New Game</h2>
          <div className="action-buttons">
            <button
              onClick={() => handleCreateGame('local')}
              disabled={loading}
            >
              Local Game
            </button>
            <button onClick={() => setShowCreateGame(true)} disabled={loading}>
              Online Game
            </button>
            <button onClick={() => setShowJoinPrivate(true)} disabled={loading}>
              Join Private Game
            </button>
          </div>
        </section>

        <section className="public-games">
          <h2>Available Public Games</h2>
          {publicGames.length === 0 ? (
            <p className="no-games">No public games available</p>
          ) : (
            <div className="games-list">
              {publicGames.map(game => (
                <div
                  key={game.id}
                  className="game-item joinable"
                  onClick={() => handleJoinGame(game.id)}
                >
                  <div className="game-info">
                    <div className="game-players">
                      {game.players.player1?.name} is waiting for an opponent
                    </div>
                    <div className="game-meta">
                      <span className="game-time">
                        {formatTimeAgo(game.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="join-button">Join</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showCreateGame && (
        <div className="modal-overlay" onClick={() => setShowCreateGame(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create Online Game</h3>
            <div className="modal-buttons">
              <button
                onClick={() => handleCreateGame('public')}
                disabled={loading}
              >
                Public Game
              </button>
              <button
                onClick={() => handleCreateGame('private')}
                disabled={loading}
              >
                Private Game
              </button>
              <button onClick={() => setShowCreateGame(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showJoinPrivate && (
        <div
          className="modal-overlay"
          onClick={() => setShowJoinPrivate(false)}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Join Private Game</h3>
            <input
              type="text"
              value={privateCode}
              onChange={e => setPrivateCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              onKeyPress={e => e.key === 'Enter' && handleJoinPrivateGame()}
            />
            <div className="modal-buttons">
              <button
                onClick={handleJoinPrivateGame}
                disabled={loading || privateCode.length !== 6}
              >
                Join Game
              </button>
              <button onClick={() => setShowJoinPrivate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
