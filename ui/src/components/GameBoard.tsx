import React, { useState, useEffect } from 'react';
import { GameEngine } from '../../../src/game-engine';
import { BinaryHomeworldsGameState } from '../../../src/game-state';
import { createSetupAction } from '../../../src/action-builders';

import { useGameActions } from '../hooks/useGameActions';
import { Piece } from '../../../src/types';
import Bank from './Bank';
import HomeSystem from './HomeSystem';
import ActionLog from './ActionLog';
import SetupInstructions from './SetupInstructions';
import './GameBoard.css';

// Setup state management
interface SetupState {
  selectedStars: Piece[];
  selectedShip: Piece | null;
  step: 'select-stars' | 'select-ship' | 'waiting' | 'complete';
}

const GameBoard: React.FC = () => {
  const [gameEngine] = useState(() => new GameEngine());
  const [gameState, setGameState] = useState<BinaryHomeworldsGameState>(
    gameEngine.getGameState()
  );
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [setupState, setSetupState] = useState<SetupState>({
    selectedStars: [],
    selectedShip: null,
    step: 'select-stars',
  });
  const { actionHistory, applyAction, getAvailableActions } =
    useGameActions(gameEngine);

  // Update game state when engine changes
  useEffect(() => {
    setGameState(gameEngine.getGameState());
  }, [gameEngine]);

  // Handle bank piece clicks during setup
  const handleBankPieceClick = (piece: Piece) => {
    if (gameState.getPhase() !== 'setup') return;
    if (gameState.getCurrentPlayer() !== 'player1') return; // Only allow player1 to set up for now

    if (
      setupState.step === 'select-stars' &&
      setupState.selectedStars.length < 2
    ) {
      // Only allow star pieces (ships can be stars in setup)
      setSetupState(prev => ({
        ...prev,
        selectedStars: [...prev.selectedStars, piece],
        step: prev.selectedStars.length === 1 ? 'select-ship' : 'select-stars',
      }));
    } else if (setupState.step === 'select-ship' && !setupState.selectedShip) {
      setSetupState(prev => ({
        ...prev,
        selectedShip: piece,
        step: 'waiting',
      }));

      // Apply setup actions one by one
      const star1Action = createSetupAction(
        'player1',
        setupState.selectedStars[0].id,
        'star1'
      );
      const star2Action = createSetupAction(
        'player1',
        setupState.selectedStars[1].id,
        'star2'
      );
      const shipAction = createSetupAction('player1', piece.id, 'ship');

      const result1 = applyAction(star1Action);
      const result2 = applyAction(star2Action);
      const result3 = applyAction(shipAction);

      if (result1.valid && result2.valid && result3.valid) {
        setGameState(gameEngine.getGameState());
        setSetupState(prev => ({ ...prev, step: 'complete' }));
      } else {
        console.error('Setup actions failed:', { result1, result2, result3 });
      }
    }
  };

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
          <Bank
            pieces={gameState.getBankPieces()}
            onPieceClick={handleBankPieceClick}
            isSetupPhase={gameState.getPhase() === 'setup'}
            selectedPieces={[
              ...setupState.selectedStars,
              ...(setupState.selectedShip ? [setupState.selectedShip] : []),
            ]}
          />
        </div>

        {/* Central play area */}
        <div className="play-area">
          {gameState.getPhase() === 'setup' ? (
            <SetupInstructions
              currentPlayer={currentPlayer}
              step={setupState.step}
              selectedStars={setupState.selectedStars.length}
              selectedShip={setupState.selectedShip !== null}
            />
          ) : (
            <>
              <div className="current-player-indicator">
                Current Turn: {currentPlayer === 'player1' ? 'You' : 'Opponent'}
              </div>
              <div className="game-phase">Phase: {gameState.getPhase()}</div>
              <div className="player-info">
                <div className="player-label">
                  You are <strong>Player 1</strong> (bottom)
                </div>
              </div>
            </>
          )}
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
