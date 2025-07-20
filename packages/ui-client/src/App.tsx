import { useEffect, useState } from 'react';

import './styles/App.css';

import GameBoard from './components/GameBoard.js';
import GameLobby from './components/GameLobby.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { ApiService } from './services/ApiService.js';
import { SocketService } from './services/SocketService.js';

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
        setConnectionError(
          'Failed to connect to server. Please make sure the server is running.'
        );
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
        ) : currentGameId ? (
          <GameBoard
            gameId={currentGameId}
            socketService={socketService}
            apiService={apiService}
            onBackToLobby={handleBackToLobby}
          />
        ) : (
          <div className="game-view">
            <div className="game-placeholder">
              <h2>No Game Selected</h2>
              <button onClick={handleBackToLobby}>Back to Lobby</button>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
