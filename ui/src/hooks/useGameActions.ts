import { useState, useCallback } from 'react';
import { GameEngine } from '../../../src/game-engine';
import { isColorAvailable } from '../../../src/utils';
import { GameAction } from '../../../src/types';

export const useGameActions = (gameEngine: GameEngine) => {
  const [actionHistory, setActionHistory] = useState<GameAction[]>([]);

  const applyAction = useCallback(
    (action: GameAction) => {
      const result = gameEngine.applyAction(action);
      if (result.valid) {
        setActionHistory(prev => [...prev, action]);
      }
      return result;
    },
    [gameEngine]
  );

  const getAvailableActions = useCallback(
    (shipId: string, systemId: string) => {
      // Get the current game state
      const gameState = gameEngine.getGameState();
      const system = gameState.getSystem(systemId);
      const ship = system?.ships.find(s => s.id === shipId);

      if (!system || !ship) {
        return [];
      }

      const currentPlayer = gameState.getCurrentPlayer();

      // Check if each action is available based on star colors in the system
      const moveEnabled = isColorAvailable(system, 'yellow', currentPlayer);
      const captureEnabled = isColorAvailable(system, 'red', currentPlayer);
      const growEnabled = isColorAvailable(system, 'green', currentPlayer);
      const tradeEnabled = isColorAvailable(system, 'blue', currentPlayer);

      // Additional checks for specific actions
      const hasEnemyShips = system.ships.some(s => s.owner !== currentPlayer);
      const captureActuallyEnabled = captureEnabled && hasEnemyShips;

      // Check if bank has pieces for grow action
      const bankPieces = gameState.getBankPieces();
      const hasGrowPieces = bankPieces.some(
        piece => piece.color === ship.color
      );
      const growActuallyEnabled = growEnabled && hasGrowPieces;

      // Check if bank has pieces for trade action
      const hasTradePieces = bankPieces.some(
        piece => piece.size === ship.size && piece.color !== ship.color
      );
      const tradeActuallyEnabled = tradeEnabled && hasTradePieces;

      return [
        {
          id: 'move',
          label: 'Move',
          description: moveEnabled
            ? 'Move this ship to another system'
            : 'No yellow star or ship available',
          enabled: moveEnabled,
          color: '#eab308',
        },
        {
          id: 'capture',
          label: 'Capture',
          description: captureActuallyEnabled
            ? 'Capture an enemy ship'
            : !captureEnabled
              ? 'No red star or ship available'
              : 'No enemy ships to capture',
          enabled: captureActuallyEnabled,
          color: '#dc2626',
        },
        {
          id: 'grow',
          label: 'Grow',
          description: growActuallyEnabled
            ? 'Create a new ship'
            : !growEnabled
              ? 'No green star or ship available'
              : 'No pieces available in bank',
          enabled: growActuallyEnabled,
          color: '#16a34a',
        },
        {
          id: 'trade',
          label: 'Trade',
          description: tradeActuallyEnabled
            ? 'Change ship color'
            : !tradeEnabled
              ? 'No blue star or ship available'
              : 'No suitable pieces in bank',
          enabled: tradeActuallyEnabled,
          color: '#2563eb',
        },
        {
          id: 'sacrifice',
          label: 'Sacrifice',
          description: 'Sacrifice for multiple actions',
          enabled: true, // Sacrifice is always available
          color: '#7c3aed',
        },
      ];
    },
    [gameEngine]
  );

  return {
    actionHistory,
    applyAction,
    getAvailableActions,
  };
};
