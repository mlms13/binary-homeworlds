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
  player1Stars: Piece[];
  player2Stars: Piece[];
  player1Ship: Piece | null;
  player2Ship: Piece | null;
  currentStep:
    | 'p1-star1'
    | 'p2-star1'
    | 'p1-star2'
    | 'p2-star2'
    | 'p1-ship'
    | 'p2-ship'
    | 'complete';
}

const GameBoard: React.FC = () => {
  const [gameEngine] = useState(() => new GameEngine());
  const [gameState, setGameState] = useState<BinaryHomeworldsGameState>(
    gameEngine.getGameState()
  );
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [setupState, setSetupState] = useState<SetupState>({
    player1Stars: [],
    player2Stars: [],
    player1Ship: null,
    player2Ship: null,
    currentStep: 'p1-star1',
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

    const currentPlayer = gameState.getCurrentPlayer();
    const { currentStep } = setupState;

    // Determine the action based on current step
    let action: any = null;
    let nextStep: SetupState['currentStep'] = currentStep;

    switch (currentStep) {
      case 'p1-star1':
        if (currentPlayer === 'player1') {
          action = createSetupAction('player1', piece.id, 'star1');
          nextStep = 'p2-star1';
          setSetupState(prev => ({
            ...prev,
            player1Stars: [piece],
            currentStep: nextStep,
          }));
        }
        break;
      case 'p2-star1':
        if (currentPlayer === 'player2') {
          action = createSetupAction('player2', piece.id, 'star1');
          nextStep = 'p1-star2';
          setSetupState(prev => ({
            ...prev,
            player2Stars: [piece],
            currentStep: nextStep,
          }));
        }
        break;
      case 'p1-star2':
        if (currentPlayer === 'player1') {
          action = createSetupAction('player1', piece.id, 'star2');
          nextStep = 'p2-star2';
          setSetupState(prev => ({
            ...prev,
            player1Stars: [...prev.player1Stars, piece],
            currentStep: nextStep,
          }));
        }
        break;
      case 'p2-star2':
        if (currentPlayer === 'player2') {
          action = createSetupAction('player2', piece.id, 'star2');
          nextStep = 'p1-ship';
          setSetupState(prev => ({
            ...prev,
            player2Stars: [...prev.player2Stars, piece],
            currentStep: nextStep,
          }));
        }
        break;
      case 'p1-ship':
        if (currentPlayer === 'player1') {
          action = createSetupAction('player1', piece.id, 'ship');
          nextStep = 'p2-ship';
          setSetupState(prev => ({
            ...prev,
            player1Ship: piece,
            currentStep: nextStep,
          }));
        }
        break;
      case 'p2-ship':
        if (currentPlayer === 'player2') {
          action = createSetupAction('player2', piece.id, 'ship');
          nextStep = 'complete';
          setSetupState(prev => ({
            ...prev,
            player2Ship: piece,
            currentStep: nextStep,
          }));
        }
        break;
    }

    if (action) {
      const result = applyAction(action);
      if (result.valid) {
        setGameState(gameEngine.getGameState());
      } else {
        console.error('Setup action failed:', result.error);
        // Revert the state change if action failed
        setSetupState(prev => ({ ...prev, currentStep }));
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
              ...setupState.player1Stars,
              ...setupState.player2Stars,
              ...(setupState.player1Ship ? [setupState.player1Ship] : []),
              ...(setupState.player2Ship ? [setupState.player2Ship] : []),
            ]}
          />
        </div>

        {/* Central play area */}
        <div className="play-area">
          {gameState.getPhase() === 'setup' ? (
            <SetupInstructions
              currentPlayer={currentPlayer}
              currentStep={setupState.currentStep}
              player1Stars={setupState.player1Stars.length}
              player2Stars={setupState.player2Stars.length}
              player1Ship={setupState.player1Ship !== null}
              player2Ship={setupState.player2Ship !== null}
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
