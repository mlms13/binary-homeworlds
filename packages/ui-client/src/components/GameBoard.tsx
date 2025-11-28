import { useCallback, useEffect, useState } from 'react';

import {
  bankToPieces,
  BinaryHomeworldsGameState,
  GameEngine,
} from '@binary-homeworlds/shared';
import {
  CaptureAction,
  Color,
  GameAction,
  MoveAction,
  Piece,
  Player,
  SetupAction,
  TradeAction,
} from '@binary-homeworlds/shared';
import {
  createOverpopulationAction,
  createSacrificeAction,
} from '@binary-homeworlds/shared';

import './GameBoard.css';

import { useGameActions } from '../hooks/useGameActions.js';
import { ApiService } from '../services/ApiService.js';
import {
  GameController,
  GameControllerCallbacks,
} from '../services/GameController.js';
import { GameSession, SocketService } from '../services/SocketService.js';
import ActionLog from './ActionLog.js';
import Bank from './Bank.js';
import ConfirmationDialog from './ConfirmationDialog.js';
import GameEndModal from './GameEndModal.js';
import GameHint from './GameHint.js';
import GameLossWarningModal from './GameLossWarningModal.js';
import HomeSystem from './HomeSystem.js';
import OverpopulationModal from './OverpopulationModal.js';
import SettingsMenu from './SettingsMenu.js';
import SetupInstructions from './SetupInstructions.js';
import StarSystem from './StarSystem.js';

interface GameBoardProps {
  gameId: string;
  socketService: SocketService;
  apiService: ApiService;
  onBackToLobby: () => void;
}

export default function GameBoard({
  gameId,
  socketService,
  apiService,
  onBackToLobby,
}: GameBoardProps) {
  const [gameEngine, setGameEngine] = useState<GameEngine>(new GameEngine());
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });
  const [gameController, setGameController] = useState<GameController | null>(
    null
  );
  const [setupState, setSetupState] = useState<
    'star1' | 'star2' | 'ship' | null
  >(null);
  const [pendingAction, setPendingAction] = useState<GameAction | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  // Capture action state
  const [pendingCapture, setPendingCapture] = useState<{
    attackingShipId: string;
    systemId: string;
    validTargetShipIds: string[];
  } | null>(null);

  // Sacrifice action state
  const [pendingSacrifice, setPendingSacrifice] = useState<{
    shipColor: Color;
    actionsRemaining: number;
    actionType: 'move' | 'capture' | 'grow' | 'trade';
  } | null>(null);

  // Game loss warning state
  const [gameLossWarning, setGameLossWarning] = useState<{
    action: GameAction;
    warningMessage: string;
  } | null>(null);

  // Overpopulation state
  const [overpopulationPrompt, setOverpopulationPrompt] = useState<{
    systemId: string;
    color: Color;
    currentPlayerPrompted: boolean;
    otherPlayerPrompted: boolean;
  } | null>(null);

  const gameState = gameEngine.getGameState();
  const state = gameState.getState();
  const currentPlayer = state.currentPlayer;

  // Initialize game controller
  useEffect(() => {
    const callbacks: GameControllerCallbacks = {
      onGameUpdated: (session: GameSession, engine: GameEngine) => {
        setGameSession(session);
        setGameEngine(engine);
        setLoading(false);
      },
      onError: (errorMessage: string) => {
        setError(errorMessage);
        setLoading(false);
        setTimeout(() => setError(null), 5000);
      },
      onOpponentHover: hoverState => {
        // Handle opponent hover state if needed
        console.log('Opponent hover:', hoverState);
      },
    };

    const controller = new GameController(apiService, socketService, callbacks);
    setGameController(controller);

    // Load the game
    controller.loadGame(gameId);

    // Cleanup on unmount
    return () => {
      controller.cleanup();
    };
  }, [gameId, apiService, socketService]);

  const {
    actionHistory,
    applyAction: applyActionWithHistory,
    getAvailableActions,
  } = useGameActions(gameEngine);

  // Determine current setup state
  const getCurrentSetupState = useCallback(() => {
    if (state.phase !== 'setup') return null;

    const currentPlayer = state.currentPlayer;
    const homeSystem = gameState.getHomeSystem(currentPlayer);

    if (!homeSystem) return 'star1';
    if (homeSystem.stars.length === 1) return 'star2';
    if (homeSystem.stars.length === 2 && homeSystem.ships.length === 0)
      return 'ship';
    return null;
  }, [state.phase, state.currentPlayer, gameState]);

  // Update setup state when game state changes
  useEffect(() => {
    setSetupState(getCurrentSetupState());
  }, [getCurrentSetupState]);

  const confirmAction = useCallback(() => {
    if (pendingAction) {
      applyActionWithHistory(pendingAction);
      setPendingAction(null);
      setShowConfirmation(false);
    }
  }, [pendingAction, applyActionWithHistory]);

  const cancelAction = useCallback(() => {
    setPendingAction(null);
    setShowConfirmation(false);
  }, []);

  const handleNewGame = useCallback(() => {
    onBackToLobby();
  }, [onBackToLobby]);

  // Helper function to clear all pending actions
  const clearAllPendingActions = useCallback(() => {
    setPendingMove(null);
    setPendingTrade(null);
    setPendingCapture(null);
  }, []);

  // Handle trade initiation from HomeSystem
  const handleTradeInitiate = useCallback(
    (shipId: string, systemId: string, validPieceIds: string[]) => {
      // Check if game has ended
      if (state.phase === 'ended') return;

      // Clear any existing pending actions before starting new one
      clearAllPendingActions();

      setPendingTrade({ shipId, systemId, validPieceIds });
    },
    [state.phase, clearAllPendingActions]
  );

  // Handle trade cancellation
  const handleCancelTrade = useCallback(() => {
    setPendingTrade(null);
  }, []);

  // Handle move initiation from HomeSystem
  const handleMoveInitiate = useCallback(
    (shipId: string, fromSystemId: string) => {
      // Check if game has ended
      if (state.phase === 'ended') return;

      // Clear any existing pending actions before starting new one
      clearAllPendingActions();

      // Calculate valid destinations and bank pieces for move
      const allSystems = state.systems;
      const fromSystem = allSystems.find(s => s.id === fromSystemId);
      const ship = fromSystem?.ships.find(s => s.id === shipId);

      if (!ship || !fromSystem) return;

      // Valid destination systems (excluding the current system and checking star size restrictions)
      const originStarSizes = fromSystem.stars.map(star => star.size);
      const validDestinationIds = allSystems
        .filter(s => {
          if (s.id === fromSystemId) return false; // Can't move to same system

          // Check star size restriction: ALL destination star sizes must be different from ALL origin star sizes
          const destStarSizes = s.stars.map(star => star.size);
          return destStarSizes.every(
            destSize => !originStarSizes.includes(destSize)
          );
        })
        .map(s => s.id);

      // Valid bank pieces for creating new systems
      // Rule: New star must be different size than origin system stars
      const validBankPieceIds = bankToPieces(state.bank)
        .filter(piece => !originStarSizes.includes(piece.size))
        .map(p => p.id);

      setPendingMove({
        shipId,
        fromSystemId,
        validDestinationIds,
        validBankPieceIds,
      });
    },
    [state.phase, state.systems, state.bank, clearAllPendingActions]
  );

  // Handle move cancellation
  const handleCancelMove = useCallback(() => {
    setPendingMove(null);
  }, []);

  // useEffect to watch overpopulations and trigger modal
  useEffect(() => {
    const gameState: BinaryHomeworldsGameState = gameEngine.getGameState();
    const overpopulations = gameState.getOverpopulations();
    const firstOverpopulation = overpopulations[0];
    if (
      firstOverpopulation &&
      (!overpopulationPrompt ||
        overpopulationPrompt.systemId !== firstOverpopulation.systemId ||
        overpopulationPrompt.color !== firstOverpopulation.color)
    ) {
      setOverpopulationPrompt({
        systemId: firstOverpopulation.systemId,
        color: firstOverpopulation.color,
        currentPlayerPrompted: false,
        otherPlayerPrompted: false,
      });
    } else if (overpopulations.length === 0 && overpopulationPrompt) {
      setOverpopulationPrompt(null);
    }
  }, [gameEngine, overpopulationPrompt]);

  // Update handleDeclareOverpopulation to NOT call checkForOverpopulation
  const handleDeclareOverpopulation = useCallback(() => {
    if (!overpopulationPrompt) return;

    const overpopulationAction = createOverpopulationAction(
      currentPlayer,
      overpopulationPrompt.systemId,
      overpopulationPrompt.color
    );

    const result = applyActionWithHistory(overpopulationAction);
    if (result.valid) {
      setOverpopulationPrompt(null);
      // The useEffect will pick up the next overpopulation if any
    }
  }, [overpopulationPrompt, currentPlayer, applyActionWithHistory]);

  // Handle ignoring overpopulation
  const handleIgnoreOverpopulation = useCallback(() => {
    if (!overpopulationPrompt) return;

    const isCurrentPlayerPrompted = overpopulationPrompt.currentPlayerPrompted;
    const isOtherPlayerPrompted = overpopulationPrompt.otherPlayerPrompted;

    if (!isCurrentPlayerPrompted) {
      // Current player is ignoring, mark them as prompted
      setOverpopulationPrompt(prev =>
        prev
          ? {
              ...prev,
              currentPlayerPrompted: true,
            }
          : null
      );
    } else if (!isOtherPlayerPrompted) {
      // Other player is ignoring, mark them as prompted
      setOverpopulationPrompt(prev =>
        prev
          ? {
              ...prev,
              otherPlayerPrompted: true,
            }
          : null
      );
    } else {
      // Both players have been prompted and ignored, clear the prompt
      setOverpopulationPrompt(null);
    }
  }, [overpopulationPrompt]);

  // Handle proceeding with game loss warning
  const handleProceedWithLoss = useCallback(() => {
    if (!gameLossWarning) return;

    // Execute the action that would cause loss
    applyActionWithHistory(gameLossWarning.action);
    // No need to check for overpopulation here; useEffect will handle it
    setGameLossWarning(null);
  }, [gameLossWarning, applyActionWithHistory]);

  // Handle canceling game loss warning
  const handleCancelLoss = useCallback(() => {
    setGameLossWarning(null);
  }, []);

  // Handle system click for move destination
  const handleSystemClick = useCallback(
    (systemId: string) => {
      if (!pendingMove) return;

      // Check if this system is a valid destination
      if (!pendingMove.validDestinationIds.includes(systemId)) return;

      // Create and execute the move action to existing system
      const moveAction: MoveAction = {
        type: 'move',
        player: state.currentPlayer,
        shipId: pendingMove.shipId,
        fromSystemId: pendingMove.fromSystemId,
        toSystemId: systemId,
        timestamp: Date.now(),
      };

      applyActionWithHistory(moveAction);
      setPendingMove(null); // Clear pending move
    },
    [pendingMove, state.currentPlayer, applyActionWithHistory]
  );

  // Handle capture initiation from StarSystem
  const handleCaptureInitiate = useCallback(
    (
      attackingShipId: string,
      systemId: string,
      validTargetShipIds: string[]
    ) => {
      // Check if game has ended
      if (state.phase === 'ended') return;

      // Clear any existing pending actions before starting new one
      clearAllPendingActions();

      setPendingCapture({ attackingShipId, systemId, validTargetShipIds });
    },
    [state.phase, clearAllPendingActions]
  );

  // Handle ship clicks during capture target selection
  const handleShipClickForCapture = useCallback(
    (targetShipId: string, systemId: string) => {
      if (!pendingCapture) return;

      // Check if this ship is a valid target
      if (!pendingCapture.validTargetShipIds.includes(targetShipId)) return;

      // Check if this is the correct system
      if (systemId !== pendingCapture.systemId) return;

      // Create and execute the capture action
      const captureAction: CaptureAction = {
        type: 'capture',
        player: state.currentPlayer,
        attackingShipId: pendingCapture.attackingShipId,
        targetShipId: targetShipId,
        systemId: pendingCapture.systemId,
        timestamp: Date.now(),
      };

      applyActionWithHistory(captureAction);
      setPendingCapture(null); // Clear pending capture
    },
    [pendingCapture, state.currentPlayer, applyActionWithHistory]
  );

  // Helper function to determine action type based on color
  const getActionTypeForColor = useCallback(
    (color: Color): 'move' | 'capture' | 'grow' | 'trade' => {
      switch (color) {
        case 'yellow':
          return 'move';
        case 'red':
          return 'capture';
        case 'green':
          return 'grow';
        case 'blue':
          return 'trade';
      }
    },
    []
  );

  // Handle sacrifice initiation from StarSystem
  const handleSacrificeInitiate = useCallback(
    (sacrificedShipId: string, systemId: string) => {
      const system = state.systems.find(s => s.id === systemId);
      const ship = system?.ships.find(s => s.id === sacrificedShipId);

      if (!ship) return;

      // Execute the sacrifice immediately and set up action mode
      const sacrificeAction = createSacrificeAction(
        currentPlayer,
        sacrificedShipId,
        systemId,
        [] // No follow-up actions planned yet
      );

      // Apply the sacrifice action (removes ship, returns to bank)
      const result = applyActionWithHistory(sacrificeAction);
      if (result.valid) {
        // Set up sacrifice action mode based on ship color
        const actionType = getActionTypeForColor(ship.color);
        setPendingSacrifice({
          shipColor: ship.color,
          actionsRemaining: ship.size,
          actionType,
        });
      }
    },
    [
      state.systems,
      currentPlayer,
      applyActionWithHistory,
      getActionTypeForColor,
    ]
  );

  // Handle sacrifice action execution
  const handleSacrificeAction = useCallback(
    (shipId: string, systemId: string) => {
      if (!pendingSacrifice) return;

      const actionType = pendingSacrifice.actionType;
      const currentPlayer = state.currentPlayer;

      // Create the appropriate action based on sacrifice type
      let action: GameAction;

      switch (actionType) {
        case 'move': {
          // For move, we need to initiate move selection
          handleMoveInitiate(shipId, systemId);
          return;
        }
        case 'capture': {
          // For capture, we need target selection - this will be handled by existing capture flow
          handleCaptureInitiate(shipId, systemId, []); // Will be populated by existing logic
          return;
        }
        case 'grow': {
          // For grow, we can execute immediately
          const system = state.systems.find(s => s.id === systemId);
          const ship = system?.ships.find(s => s.id === shipId);
          if (!ship) return;

          const availablePieces = bankToPieces(state.bank)
            .filter(piece => piece.color === pendingSacrifice.shipColor)
            .sort((a, b) => a.size - b.size);

          const smallestPiece = availablePieces[0];
          if (!smallestPiece) return;

          action = {
            type: 'grow',
            player: currentPlayer,
            actingShipId: shipId,
            systemId,
            newShipPieceId: smallestPiece.id,
            timestamp: Date.now(),
          };
          break;
        }
        case 'trade': {
          // For trade, we need piece selection - this will be handled by existing trade flow
          const tradeSystem = state.systems.find(s => s.id === systemId);
          const tradeShip = tradeSystem?.ships.find(s => s.id === shipId);
          if (tradeShip) {
            const validPieceIds = bankToPieces(state.bank)
              .filter(piece => piece.size === tradeShip.size)
              .map(p => p.id);
            handleTradeInitiate(shipId, systemId, validPieceIds);
            return;
          }
          return;
        }
      }

      // Execute the action
      const result = applyActionWithHistory(action!);
      if (result.valid) {
        // Decrement remaining actions
        setPendingSacrifice(prev => {
          if (!prev) return null;
          const newActionsRemaining = prev.actionsRemaining - 1;
          if (newActionsRemaining <= 0) {
            // End sacrifice mode and end turn
            return null;
          }
          return {
            ...prev,
            actionsRemaining: newActionsRemaining,
          };
        });
      }
    },
    [
      pendingSacrifice,
      state.systems,
      state.bank,
      state.currentPlayer,
      handleMoveInitiate,
      handleCaptureInitiate,
      handleTradeInitiate,
      applyActionWithHistory,
    ]
  );

  const handlePieceClick = useCallback(
    (piece: Piece) => {
      // Handle trade actions during normal play
      if (state.phase === 'normal' && pendingTrade) {
        // Check if this piece is valid for the trade
        if (!pendingTrade.validPieceIds.includes(piece.id)) return;

        // Create and execute the trade action
        const tradeAction: TradeAction = {
          type: 'trade',
          player: state.currentPlayer,
          shipId: pendingTrade.shipId,
          systemId: pendingTrade.systemId,
          newPieceId: piece.id,
          timestamp: Date.now(),
        };

        applyActionWithHistory(tradeAction);
        setPendingTrade(null); // Clear pending trade
        return;
      }

      // Handle move actions during normal play (creating new system)
      if (state.phase === 'normal' && pendingMove) {
        // Check if this piece is valid for creating a new system
        if (!pendingMove.validBankPieceIds.includes(piece.id)) return;

        // Create and execute the move action to create new system
        const moveAction: MoveAction = {
          type: 'move',
          player: state.currentPlayer,
          shipId: pendingMove.shipId,
          fromSystemId: pendingMove.fromSystemId,
          newStarPieceId: piece.id,
          timestamp: Date.now(),
        };

        applyActionWithHistory(moveAction);
        setPendingMove(null); // Clear pending move
        return;
      }

      // Handle setup phase
      if (state.phase !== 'setup' || !setupState) return;

      const setupAction: SetupAction = {
        type: 'setup',
        player: state.currentPlayer,
        pieceId: piece.id,
        role: setupState,
        timestamp: Date.now(),
      };

      applyActionWithHistory(setupAction);
    },
    [
      state.phase,
      setupState,
      state.currentPlayer,
      applyActionWithHistory,
      pendingTrade,
      pendingMove,
    ]
  );

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
    if (!gameController) return player === 'player1' ? 'Player 1' : 'Player 2';
    return gameController.getPlayerDisplayName(player);
  };

  const player1Home = gameState.getHomeSystem('player1');
  const player2Home = gameState.getHomeSystem('player2');

  return (
    <div className="game-board">
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
          onClick={() => setIsLogVisible(!isLogVisible)}
          className="log-toggle-btn"
        >
          {isLogVisible ? '→' : '←'} Log
        </button>
      </div>

      <div className="game-header">
        <button className="back-button" onClick={onBackToLobby}>
          ← Back to Lobby
        </button>

        <div className="game-info">
          <div className="players">
            {getPlayerDisplayName('player1')} vs{' '}
            {getPlayerDisplayName('player2')}
          </div>
          {gameController && !gameController.isLocalGame() && gameSession && (
            <div className="game-type">
              {gameSession.type === 'private'
                ? `Private Game (${gameSession.privateCode})`
                : 'Public Game'}
            </div>
          )}
        </div>
      </div>

      <div className="current-turn">
        <div className="turn-indicator">
          {state.phase === 'setup'
            ? `${getPlayerDisplayName(currentPlayer)}'s turn to set up${
                setupState
                  ? ` - Select ${setupState === 'star1' ? 'first star' : setupState === 'star2' ? 'second star' : 'starting ship'}`
                  : ''
              }`
            : `${getPlayerDisplayName(currentPlayer)}'s turn`}
        </div>

        {/* Game hints */}
        {state.phase === 'setup' && setupState && (
          <GameHint>
            Click on a piece in the bank to select your{' '}
            {setupState === 'star1'
              ? 'first star'
              : setupState === 'star2'
                ? 'second star'
                : 'starting ship'}
          </GameHint>
        )}

        {state.phase === 'normal' && (
          <>
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
            ) : pendingCapture ? (
              <GameHint>
                Click on an enemy ship to capture it, or{' '}
                <button
                  onClick={() => setPendingCapture(null)}
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
                  cancel capture
                </button>
              </GameHint>
            ) : (
              <GameHint>
                {currentPlayer === 'player1'
                  ? 'Click on one of your ships to take an action'
                  : "Waiting for opponent's move..."}
              </GameHint>
            )}
          </>
        )}
      </div>

      <div className="main-area">
        <div className="bank-container">
          <Bank
            pieces={bankToPieces(state.bank)}
            selectedPieces={[]}
            onPieceClick={handlePieceClick}
            isSetupPhase={state.phase === 'setup'}
            validTradeIds={pendingTrade?.validPieceIds || []}
            isTradeMode={!!pendingTrade}
            validMoveIds={pendingMove?.validBankPieceIds || []}
            isMoveMode={!!pendingMove}
          />
        </div>

        <div className="play-area">
          <div className="top-area">
            {player2Home && (
              <div className="opponent-home">
                <HomeSystem
                  system={player2Home}
                  isCurrentPlayer={currentPlayer === 'player2'}
                  isOpponent={gameController?.getPlayerRole() === 'player1'}
                  onAction={applyActionWithHistory}
                  getAvailableActions={getAvailableActions}
                  bankPieces={bankToPieces(state.bank)}
                  currentPlayer={currentPlayer}
                  onTradeInitiate={handleTradeInitiate}
                  onMoveInitiate={handleMoveInitiate}
                  onCaptureInitiate={handleCaptureInitiate}
                  onShipClickForCapture={handleShipClickForCapture}
                  pendingCapture={pendingCapture}
                  onSacrificeInitiate={handleSacrificeInitiate}
                  pendingSacrifice={pendingSacrifice}
                  onShipClickForSacrifice={handleSacrificeAction}
                  onSystemClick={handleSystemClick}
                  isMoveDestination={
                    !!pendingMove &&
                    pendingMove.validDestinationIds.includes(player2Home.id)
                  }
                />
              </div>
            )}
          </div>

          <div className="center-area">
            {state.phase === 'setup' ? (
              <SetupInstructions
                currentPlayer={currentPlayer}
                currentStep={setupState}
              />
            ) : (
              <div className="systems-grid">
                {state.systems
                  .filter(
                    system =>
                      system.id !== state.players.player1.homeSystemId &&
                      system.id !== state.players.player2.homeSystemId
                  )
                  .map(system => (
                    <StarSystem
                      key={system.id}
                      system={system}
                      onAction={applyActionWithHistory}
                      getAvailableActions={getAvailableActions}
                      bankPieces={bankToPieces(state.bank)}
                      currentPlayer={currentPlayer}
                      onTradeInitiate={handleTradeInitiate}
                      onMoveInitiate={handleMoveInitiate}
                      onCaptureInitiate={handleCaptureInitiate}
                      onShipClickForCapture={handleShipClickForCapture}
                      pendingCapture={pendingCapture}
                      onSacrificeInitiate={handleSacrificeInitiate}
                      pendingSacrifice={pendingSacrifice}
                      onShipClickForSacrifice={handleSacrificeAction}
                      onSystemClick={handleSystemClick}
                      isMoveDestination={
                        !!pendingMove &&
                        pendingMove.validDestinationIds.includes(system.id)
                      }
                    />
                  ))}
              </div>
            )}
          </div>

          <div className="bottom-area">
            {player1Home && (
              <HomeSystem
                system={player1Home}
                isCurrentPlayer={currentPlayer === 'player1'}
                isOpponent={gameController?.getPlayerRole() === 'player2'}
                onAction={applyActionWithHistory}
                getAvailableActions={getAvailableActions}
                bankPieces={bankToPieces(state.bank)}
                currentPlayer={currentPlayer}
                onTradeInitiate={handleTradeInitiate}
                onMoveInitiate={handleMoveInitiate}
                onCaptureInitiate={handleCaptureInitiate}
                onShipClickForCapture={handleShipClickForCapture}
                pendingCapture={pendingCapture}
                onSacrificeInitiate={handleSacrificeInitiate}
                pendingSacrifice={pendingSacrifice}
                onShipClickForSacrifice={handleSacrificeAction}
                onSystemClick={handleSystemClick}
                isMoveDestination={
                  !!pendingMove &&
                  pendingMove.validDestinationIds.includes(player1Home.id)
                }
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

      {/* Game loss warning modal */}
      {gameLossWarning && (
        <GameLossWarningModal
          action={gameLossWarning.action}
          warningMessage={gameLossWarning.warningMessage}
          onProceed={handleProceedWithLoss}
          onCancel={handleCancelLoss}
        />
      )}

      {/* Overpopulation modal */}
      {overpopulationPrompt && (
        <OverpopulationModal
          systemId={overpopulationPrompt.systemId}
          color={overpopulationPrompt.color}
          currentPlayer={currentPlayer}
          currentPlayerPrompted={overpopulationPrompt.currentPlayerPrompted}
          otherPlayerPrompted={overpopulationPrompt.otherPlayerPrompted}
          onDeclareOverpopulation={handleDeclareOverpopulation}
          onIgnoreOverpopulation={handleIgnoreOverpopulation}
        />
      )}

      {/* Game end modal */}
      {state.phase === 'ended' && state.winner && (
        <GameEndModal winner={state.winner} onNewGame={handleNewGame} />
      )}
    </div>
  );
}
