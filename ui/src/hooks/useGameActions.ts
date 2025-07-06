import { useState, useCallback } from 'react';
import { GameEngine } from '../../../src/game-engine';
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
    (_shipId: string, _systemId: string) => {
      // const gameState = gameEngine.getGameState();
      // const _currentPlayer = gameState.getCurrentPlayer();

      // TODO: Implement proper action availability checking
      // For now, return a basic set of actions
      return [
        {
          id: 'move',
          label: 'Move',
          description: 'Move this ship to another system',
          enabled: true,
          color: '#eab308',
        },
        {
          id: 'capture',
          label: 'Capture',
          description: 'Capture an enemy ship',
          enabled: false, // TODO: Check if capture is possible
          color: '#dc2626',
        },
        {
          id: 'grow',
          label: 'Grow',
          description: 'Create a new ship',
          enabled: true,
          color: '#16a34a',
        },
        {
          id: 'trade',
          label: 'Trade',
          description: 'Change ship color',
          enabled: true,
          color: '#2563eb',
        },
        {
          id: 'sacrifice',
          label: 'Sacrifice',
          description: 'Sacrifice for multiple actions',
          enabled: true,
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
