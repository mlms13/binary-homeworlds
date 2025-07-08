import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import GameLobby from './components/GameLobby';
import { SocketService } from './services/SocketService';
import { ApiService } from './services/ApiService';
import './styles/App.css';

function App() {
  const [socketService] = useState(() => new SocketService());
  const [apiService] = useState(() => new ApiService());
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const connectToServer = async () => {
      try {
        await socketService.connect();
        setConnectionError(null);
      } catch (error) {
        console.error('Failed to connect to server:', error);
        setConnectionError('Failed to connect to server. Please make sure the server is running.');
      }
    };

    connectToServer();

    return () => {
      socketService.disconnect();
    };
  }, [socketService]);

  const handleGameSelected = (gameId: string) => {
    setCurrentGameId(gameId);
    setCurrentView('game');
  };

  const handleBackToLobby = () => {
    setCurrentView('lobby');
    setCurrentGameId(null);
  };

  if (connectionError) {
    return (
      <ThemeProvider>
        <div className="app">
          <div className="connection-error">
            <h2>Connection Error</h2>
            <p>{connectionError}</p>
            <button onClick={() => window.location.reload()}>
              Retry Connection
            </button>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="app">
        {currentView === 'lobby' ? (
          <GameLobby
            apiService={apiService}
            socketService={socketService}
            onGameSelected={handleGameSelected}
          />
        ) : (
          <div className="game-view">
            <button className="back-to-lobby" onClick={handleBackToLobby}>
              ← Back to Lobby
            </button>
            <div className="game-placeholder">
              <h2>Game View Coming Soon</h2>
              <p>Game ID: {currentGameId}</p>
              <p>The game board will be integrated here in the next step.</p>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
