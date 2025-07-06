import React, { useState, useEffect } from 'react';
import { GameEngine } from '../../../src/game-engine';
import { BinaryHomeworldsGameState } from '../../../src/game-state';
import { createSetupAction } from '../../../src/action-builders';
import { createShip, createStar, createSystem } from '../../../src/utils';
import { useGameActions } from '../hooks/useGameActions';
import Bank from './Bank';
import HomeSystem from './HomeSystem';
import ActionLog from './ActionLog';
import './GameBoard.css';

// Demo initialization function
const initializeDemo = (engine: GameEngine) => {
  // Create player 1 home system
  const player1Ship = createShip('green', 2, 'player1');
  const player1Star1 = createStar('red', 1);
  const player1Star2 = createStar('blue', 3);
  createSystem([player1Star1, player1Star2], [player1Ship]);

  // Create player 2 home system
  const player2Ship = createShip('green', 2, 'player2');
  const player2Star1 = createStar('yellow', 1);
  const player2Star2 = createStar('blue', 3);
  createSystem([player2Star1, player2Star2], [player2Ship]);

  // Apply setup actions
  const setupAction1 = createSetupAction(
    'player1',
    [player1Star1, player1Star2],
    player1Ship
  );
  const setupAction2 = createSetupAction(
    'player2',
    [player2Star1, player2Star2],
    player2Ship
  );

  engine.applyAction(setupAction1);
  engine.applyAction(setupAction2);
};

const GameBoard: React.FC = () => {
  const [gameEngine] = useState(() => {
    const engine = new GameEngine();
    // Initialize with a basic setup for demonstration
    initializeDemo(engine);
    return engine;
  });
  const [gameState, setGameState] = useState<BinaryHomeworldsGameState>(
    gameEngine.getGameState()
  );
  const [isLogOpen, setIsLogOpen] = useState(false);
  const { actionHistory, applyAction, getAvailableActions } =
    useGameActions(gameEngine);

  // Update game state when engine changes
  useEffect(() => {
    setGameState(gameEngine.getGameState());
  }, [gameEngine]);

  // Get home systems for both players
  const systems = gameState.getSystems();
  const player1Home = systems.find(system =>
    system.ships.some(ship => ship.owner === 'player1')
  );
  const player2Home = systems.find(system =>
    system.ships.some(ship => ship.owner === 'player2')
  );

  const currentPlayer = gameState.getCurrentPlayer();

  return (
    <div className="game-board">
      {/* Top area - Opponent's home system */}
      <div className="top-area">
        <div className="opponent-home">
          {player2Home ? (
            <HomeSystem
              system={player2Home}
              isCurrentPlayer={currentPlayer === 'player2'}
              isOpponent={currentPlayer === 'player1'}
              onAction={applyAction}
              getAvailableActions={getAvailableActions}
            />
          ) : (
            <div className="no-system">
              <div className="no-system-text">Opponent's Home System</div>
              <div className="no-system-subtitle">Waiting for setup...</div>
            </div>
          )}
        </div>
      </div>

      {/* Main game area */}
      <div className="main-area">
        {/* Bank in top-left */}
        <div className="bank-container">
          <Bank pieces={gameState.getBankPieces()} />
        </div>

        {/* Central play area */}
        <div className="play-area">
          <div className="current-player-indicator">
            Current Turn: {currentPlayer === 'player1' ? 'You' : 'Opponent'}
          </div>
          <div className="game-phase">Phase: {gameState.getPhase()}</div>
          <div className="player-info">
            <div className="player-label">
              You are <strong>Player 1</strong> (bottom)
            </div>
          </div>
        </div>

        {/* Action log toggle */}
        <div className="log-toggle">
          <button
            onClick={() => setIsLogOpen(!isLogOpen)}
            className="log-toggle-btn"
          >
            {isLogOpen ? '→' : '←'} Log
          </button>
        </div>
      </div>

      {/* Bottom area - Current player's home system */}
      <div className="bottom-area">
        <div className="player-home">
          {player1Home ? (
            <HomeSystem
              system={player1Home}
              isCurrentPlayer={currentPlayer === 'player1'}
              isOpponent={currentPlayer === 'player2'}
              onAction={applyAction}
              getAvailableActions={getAvailableActions}
            />
          ) : (
            <div className="no-system">
              <div className="no-system-text">Your Home System</div>
              <div className="no-system-subtitle">Waiting for setup...</div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible action log */}
      <ActionLog
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        actions={actionHistory}
      />
    </div>
  );
};

export default GameBoard;
