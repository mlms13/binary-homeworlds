import React from 'react';

import { GamePiece, StarSystem } from '@binary-homeworlds/engine';
import { ActionValidationResult, GameAction } from '@binary-homeworlds/shared';

import StarSystemComponent from './StarSystem';

interface ActionOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  color?: string;
}

interface HomeSystemProps {
  system: StarSystem.StarSystem;
  isCurrentPlayer: boolean;
  isOpponent: boolean;
  onAction: (action: GameAction) => ActionValidationResult;
  getAvailableActions: (
    shipId: GamePiece.PieceId,
    systemId: string
  ) => Array<ActionOption>;
  bankPieces: Array<GamePiece.Piece>;
  currentPlayer: 'player1' | 'player2';
  onTradeInitiate?: (
    shipId: GamePiece.PieceId,
    systemId: string,
    validPieceIds: Array<GamePiece.PieceId>
  ) => void;
  onMoveInitiate?: (shipId: GamePiece.PieceId, fromSystemId: string) => void;
  onCaptureInitiate?: (
    attackingShipId: GamePiece.PieceId,
    systemId: string,
    validTargetShipIds: Array<GamePiece.PieceId>
  ) => void;
  onShipClickForCapture?: (
    targetShipId: GamePiece.PieceId,
    systemId: string
  ) => void;
  pendingCapture?: {
    attackingShipId: GamePiece.PieceId;
    systemId: string;
    validTargetShipIds: Array<GamePiece.PieceId>;
  } | null;
  onSacrificeInitiate?: (
    sacrificedShipId: GamePiece.PieceId,
    systemId: string
  ) => void;
  pendingSacrifice?: {
    shipColor: GamePiece.Color;
    actionsRemaining: number;
    actionType: 'move' | 'capture' | 'grow' | 'trade';
  } | null;
  onShipClickForSacrifice?: (
    shipId: GamePiece.PieceId,
    systemId: string
  ) => void;
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
  onCaptureInitiate,
  onShipClickForCapture,
  pendingCapture,
  onSacrificeInitiate,
  pendingSacrifice,
  onShipClickForSacrifice,
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
    <StarSystemComponent
      system={system}
      onAction={onAction}
      getAvailableActions={getAvailableActions}
      bankPieces={bankPieces}
      currentPlayer={currentPlayer}
      onTradeInitiate={onTradeInitiate}
      onMoveInitiate={onMoveInitiate}
      onCaptureInitiate={onCaptureInitiate}
      onShipClickForCapture={onShipClickForCapture}
      pendingCapture={pendingCapture}
      onSacrificeInitiate={onSacrificeInitiate}
      pendingSacrifice={pendingSacrifice}
      onShipClickForSacrifice={onShipClickForSacrifice}
      onSystemClick={onSystemClick}
      isMoveDestination={isMoveDestination}
      title={getSystemTitle()}
    />
  );
};

export default HomeSystem;
