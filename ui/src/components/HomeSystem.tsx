import React from 'react';
import {
  System,
  GameAction,
  ActionValidationResult,
  Piece,
} from '../../../src/types';
import StarSystem from './StarSystem';

interface ActionOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  color?: string;
}

interface HomeSystemProps {
  system: System;
  isCurrentPlayer: boolean;
  isOpponent: boolean;
  onAction: (action: GameAction) => ActionValidationResult;
  getAvailableActions: (shipId: string, systemId: string) => ActionOption[];
  bankPieces: Piece[];
  currentPlayer: 'player1' | 'player2';
  onTradeInitiate?: (
    shipId: string,
    systemId: string,
    validPieceIds: string[]
  ) => void;
  onMoveInitiate?: (shipId: string, fromSystemId: string) => void;
  onSystemClick?: (systemId: string) => void;
  isMoveDestination?: boolean;
}

const HomeSystem: React.FC<HomeSystemProps> = ({
  system,
  isCurrentPlayer: _isCurrentPlayer,
  isOpponent,
  onAction,
  getAvailableActions,
  bankPieces,
  currentPlayer,
  onTradeInitiate,
  onMoveInitiate,
  onSystemClick,
  isMoveDestination = false,
}) => {
  // Helper function to determine home system title
  const getSystemTitle = () => {
    if (isOpponent) {
      return "Opponent's Home System";
    } else {
      return 'Your Home System';
    }
  };

  return (
    <StarSystem
      system={system}
      onAction={onAction}
      getAvailableActions={getAvailableActions}
      bankPieces={bankPieces}
      currentPlayer={currentPlayer}
      onTradeInitiate={onTradeInitiate}
      onMoveInitiate={onMoveInitiate}
      onSystemClick={onSystemClick}
      isMoveDestination={isMoveDestination}
      title={getSystemTitle()}
    />
  );
};

export default HomeSystem;
