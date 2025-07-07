import React, { useState, useEffect } from 'react';
import { GameEngine } from '../../../src/game-engine';
import { BinaryHomeworldsGameState } from '../../../src/game-state';
import {
  createSetupAction,
  createTradeAction,
  createMoveAction,
} from '../../../src/action-builders';

import { useGameActions } from '../hooks/useGameActions';
import { Piece } from '../../../src/types';
import Bank from './Bank';
import HomeSystem from './HomeSystem';
import StarSystem from './StarSystem';
import ActionLog from './ActionLog';
import SetupInstructions from './SetupInstructions';
import GameHint from './GameHint';
import SettingsMenu from './SettingsMenu';
import ConfirmationDialog from './ConfirmationDialog';
import { useTheme } from '../contexts/ThemeContext';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });
  const [pendingAction, setPendingAction] = useState<ReturnType<
    typeof createSetupAction
  > | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { confirmTurnActions } = useTheme();
  const [setupState, setSetupState] = useState<SetupState>({
    player1Stars: [],
    player2Stars: [],
    player1Ship: null,
    player2Ship: null,
    currentStep: 'p1-star1',
  });

  // Trade action state
  const [pendingTrade, setPendingTrade] = useState<{
    shipId: string;
    systemId: string;
    validPieceIds: string[];
  } | null>(null);

  // Move action state
  const [pendingMove, setPendingMove] = useState<{
    shipId: string;
    fromSystemId: string;
    validDestinationIds: string[];
    validBankPieceIds: string[];
  } | null>(null);

  const { actionHistory, applyAction, getAvailableActions } =
    useGameActions(gameEngine);

  // Handle trade initiation from HomeSystem
  const handleTradeInitiate = (
    shipId: string,
    systemId: string,
    validPieceIds: string[]
  ) => {
    setPendingTrade({ shipId, systemId, validPieceIds });
  };

  // Handle trade cancellation
  const handleCancelTrade = () => {
    setPendingTrade(null);
  };

  // Handle move initiation from HomeSystem
  const handleMoveInitiate = (shipId: string, fromSystemId: string) => {
    // Calculate valid destinations and bank pieces for move
    const allSystems = gameState.getSystems();
    const fromSystem = allSystems.find(s => s.id === fromSystemId);
    const ship = fromSystem?.ships.find(s => s.id === shipId);

    if (!ship || !fromSystem) return;

    // Valid destination systems (excluding the current system)
    const validDestinationIds = allSystems
      .filter(s => s.id !== fromSystemId)
      .map(s => s.id);

    // Valid bank pieces for creating new systems
    // Rule: New star must be different size than origin system stars
    const originStarSizes = fromSystem.stars.map(star => star.size);
    const validBankPieceIds = gameState
      .getBankPieces()
      .filter(piece => !originStarSizes.includes(piece.size))
      .map(p => p.id);

    setPendingMove({
      shipId,
      fromSystemId,
      validDestinationIds,
      validBankPieceIds,
    });
  };

  // Handle move cancellation
  const handleCancelMove = () => {
    setPendingMove(null);
  };

  // Handle system click for move destination
  const handleSystemClick = (systemId: string) => {
    if (!pendingMove) return;

    // Check if this system is a valid destination
    if (!pendingMove.validDestinationIds.includes(systemId)) return;

    // Create and execute the move action to existing system
    const moveAction = createMoveAction(
      gameState.getCurrentPlayer(),
      pendingMove.shipId,
      pendingMove.fromSystemId,
      systemId, // toSystemId
      undefined // newStarPieceId is undefined for existing system
    );

    handleAction(moveAction);
    setPendingMove(null); // Clear pending move
  };

  // Wrapper for applyAction that handles confirmation
  const handleAction = (action: any) => {
    // Check if this action will end the turn (grow, trade, move, capture, sacrifice)
    const turnEndingActions = ['grow', 'trade', 'move', 'capture', 'sacrifice'];
    const willEndTurn = turnEndingActions.includes(action.type);

    if (
      confirmTurnActions &&
      gameState.getPhase() === 'normal' &&
      willEndTurn
    ) {
      setPendingAction(action);
      setShowConfirmation(true);
      return { valid: true, message: 'Action pending confirmation' }; // Return success for now, actual validation happens on confirm
    } else {
      const result = applyAction(action);
      if (result.valid) {
        // Update game state after successful action
        setGameState(gameEngine.getGameState());
      }
      return result;
    }
  };

  const confirmAction = () => {
    if (pendingAction) {
      const result = applyAction(pendingAction);
      if (result.valid) {
        // Update game state after successful action
        setGameState(gameEngine.getGameState());
      }
      setPendingAction(null);
    }
    setShowConfirmation(false);
  };

  const cancelAction = () => {
    setPendingAction(null);
    setShowConfirmation(false);
  };

  // Update game state when engine changes
  useEffect(() => {
    setGameState(gameEngine.getGameState());
  }, [gameEngine]);

  // Handle bank piece clicks during setup, trade actions, and move actions
  const handleBankPieceClick = (piece: Piece) => {
    // Handle trade actions during normal play
    if (gameState.getPhase() === 'normal' && pendingTrade) {
      // Check if this piece is valid for the trade
      if (!pendingTrade.validPieceIds.includes(piece.id)) return;

      // Create and execute the trade action
      const tradeAction = createTradeAction(
        gameState.getCurrentPlayer(),
        pendingTrade.shipId,
        pendingTrade.systemId,
        piece.id
      );

      handleAction(tradeAction);
      setPendingTrade(null); // Clear pending trade
      return;
    }

    // Handle move actions during normal play (creating new system)
    if (gameState.getPhase() === 'normal' && pendingMove) {
      // Check if this piece is valid for creating a new system
      if (!pendingMove.validBankPieceIds.includes(piece.id)) return;

      // Create and execute the move action to create new system
      const moveAction = createMoveAction(
        gameState.getCurrentPlayer(),
        pendingMove.shipId,
        pendingMove.fromSystemId,
        undefined, // toSystemId is undefined for new system
        piece.id // newStarPieceId
      );

      handleAction(moveAction);

      setPendingMove(null); // Clear pending move
      return;
    }

    // Handle setup phase
    if (gameState.getPhase() !== 'setup') return;

    const currentPlayer = gameState.getCurrentPlayer();
    const { currentStep } = setupState;

    // Determine the action based on current step
    let action: ReturnType<typeof createSetupAction> | null = null;
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

  // Get home systems for both players using the proper game state method
  const systems = gameState.getSystems();
  const player1Home = gameState.getHomeSystem('player1');
  const player2Home = gameState.getHomeSystem('player2');

  // Get non-home systems (all systems that aren't the primary home systems)
  const nonHomeSystems = systems.filter(system => {
    // Include all systems except the primary home systems
    return system.id !== player1Home?.id && system.id !== player2Home?.id;
  });

  const currentPlayer = gameState.getCurrentPlayer();

  // Create display home systems that show selected pieces during setup
  const getDisplayHomeSystem = (player: 'player1' | 'player2') => {
    const actualHome = player === 'player1' ? player1Home : player2Home;
    if (actualHome) return actualHome;

    // During setup, create temporary system with selected pieces
    if (gameState.getPhase() === 'setup') {
      const stars =
        player === 'player1'
          ? setupState.player1Stars
          : setupState.player2Stars;
      const ship =
        player === 'player1' ? setupState.player1Ship : setupState.player2Ship;

      return {
        id: `temp-${player}-home`,
        stars: stars.map(piece => ({ ...piece, id: `temp-star-${piece.id}` })),
        ships: ship
          ? [{ ...ship, id: `temp-ship-${ship.id}`, owner: player }]
          : [],
      };
    }

    return null;
  };

  const displayPlayer1Home = getDisplayHomeSystem('player1');
  const displayPlayer2Home = getDisplayHomeSystem('player2');

  return (
    <div className="game-board">
      {/* Bank in top-left of entire board */}
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
          validTradeIds={pendingTrade?.validPieceIds || []}
          isTradeMode={!!pendingTrade}
          validMoveIds={pendingMove?.validBankPieceIds || []}
          isMoveMode={!!pendingMove}
        />
      </div>

      {/* Top-right controls */}
      <div className="top-right-controls">
        <button
          onClick={event => {
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            setSettingsPosition({
              x: rect.left,
              y: rect.bottom + 10,
            });
            setIsSettingsOpen(!isSettingsOpen);
          }}
          className="settings-btn"
          title="Settings"
        >
          ⚙️
        </button>
        <button
          onClick={() => setIsLogOpen(!isLogOpen)}
          className="log-toggle-btn"
        >
          {isLogOpen ? '→' : '←'} Log
        </button>
      </div>

      {/* Top area - Opponent's home system */}
      <div className="top-area">
        <div className="opponent-home">
          {displayPlayer2Home ? (
            <HomeSystem
              system={displayPlayer2Home}
              isCurrentPlayer={
                gameState.getPhase() === 'normal' && currentPlayer === 'player2'
              }
              isOpponent={true} // Top area is always opponent from human perspective
              onAction={handleAction}
              getAvailableActions={getAvailableActions}
              bankPieces={gameState.getBankPieces()}
              currentPlayer={currentPlayer}
              onTradeInitiate={handleTradeInitiate}
              onMoveInitiate={handleMoveInitiate}
              onSystemClick={handleSystemClick}
              isMoveDestination={
                !!pendingMove &&
                pendingMove.validDestinationIds.includes(displayPlayer2Home.id)
              }
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
            <div className="normal-play-instructions">
              <div className="current-player-indicator">
                <div className="turn-label">
                  Current Turn:{' '}
                  {currentPlayer === 'player1' ? 'You' : 'Opponent'}
                </div>
                {pendingTrade ? (
                  <GameHint>
                    Click on a valid piece in the bank to complete the trade, or{' '}
                    <button
                      onClick={handleCancelTrade}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit',
                      }}
                    >
                      cancel trade
                    </button>
                  </GameHint>
                ) : pendingMove ? (
                  <GameHint>
                    Click on an existing system or a bank piece to create a new
                    system, or{' '}
                    <button
                      onClick={handleCancelMove}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit',
                      }}
                    >
                      cancel move
                    </button>
                  </GameHint>
                ) : currentPlayer === 'player1' ? (
                  <GameHint>
                    Click on one of your ships to take an action
                  </GameHint>
                ) : (
                  <GameHint icon="⏳">Waiting for opponent's move...</GameHint>
                )}
              </div>

              {/* Display non-home systems */}
              {nonHomeSystems.length > 0 && (
                <div className="other-systems">
                  <div className="other-systems-label">Other Systems:</div>
                  <div className="other-systems-grid">
                    {nonHomeSystems.map(system => (
                      <StarSystem
                        key={system.id}
                        system={system}
                        onAction={handleAction}
                        getAvailableActions={getAvailableActions}
                        bankPieces={gameState.getBankPieces()}
                        currentPlayer={currentPlayer}
                        onTradeInitiate={handleTradeInitiate}
                        onMoveInitiate={handleMoveInitiate}
                        onSystemClick={handleSystemClick}
                        isMoveDestination={
                          !!pendingMove &&
                          pendingMove.validDestinationIds.includes(system.id)
                        }
                        title="Star System"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom area - Current player's home system */}
      <div className="bottom-area">
        <div className="player-home">
          {displayPlayer1Home ? (
            <HomeSystem
              system={displayPlayer1Home}
              isCurrentPlayer={
                gameState.getPhase() === 'normal' && currentPlayer === 'player1'
              }
              isOpponent={false} // Bottom area is always you from human perspective
              onAction={handleAction}
              getAvailableActions={getAvailableActions}
              bankPieces={gameState.getBankPieces()}
              currentPlayer={currentPlayer}
              onTradeInitiate={handleTradeInitiate}
              onMoveInitiate={handleMoveInitiate}
              onSystemClick={handleSystemClick}
              isMoveDestination={
                !!pendingMove &&
                pendingMove.validDestinationIds.includes(displayPlayer1Home.id)
              }
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

      {/* Settings menu */}
      <SettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        position={settingsPosition}
      />

      {/* Confirmation dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Confirm Action"
        message={`Are you sure you want to perform this ${pendingAction?.type || 'action'}? This will end your turn and pass to your opponent.`}
        confirmText="Confirm & End Turn"
        cancelText="Cancel"
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
    </div>
  );
};

export default GameBoard;
