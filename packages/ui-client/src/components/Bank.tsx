import React from 'react';

import { GamePiece } from '@binary-homeworlds/engine';

import './Bank.css';

import TrianglePiece from './TrianglePiece.js';

interface BankProps {
  pieces: GamePiece.Piece[];
  onPieceClick?: (piece: GamePiece.Piece) => void;
  isSetupPhase?: boolean;
  selectedPieces?: GamePiece.Piece[];
  validTradeIds?: GamePiece.PieceId[];
  isTradeMode?: boolean;
  validMoveIds?: GamePiece.PieceId[];
  isMoveMode?: boolean;
}

const Bank: React.FC<BankProps> = ({
  pieces,
  onPieceClick,
  isSetupPhase = false,
  selectedPieces: _selectedPieces = [],
  validTradeIds = [],
  isTradeMode = false,
  validMoveIds = [],
  isMoveMode = false,
}) => {
  // Group pieces by color first, then by size
  const groupedByColor = pieces.reduce(
    (acc, piece) => {
      if (!acc[piece.color]) {
        acc[piece.color] = {};
      }
      if (!acc[piece.color]?.[piece.size]) {
        acc[piece.color]![piece.size] = [];
      }
      acc[piece.color]![piece.size]!.push(piece);
      return acc;
    },
    {} as Record<string, Record<number, GamePiece.Piece[]>>
  );

  // Define color order for consistent display
  const colorOrder: GamePiece.Color[] = ['red', 'yellow', 'green', 'blue'];
  const sizeOrder = [3, 2, 1]; // Reversed: large to small

  return (
    <div className="bank">
      <div className="bank-header">
        <h3>Bank</h3>
        <span className="piece-count">{pieces.length} pieces</span>
      </div>
      <div className="bank-pieces">
        {colorOrder.map(color => (
          <div key={color} className="color-row">
            <div className="size-pieces">
              {sizeOrder.map(size => {
                const piecesOfType = groupedByColor[color]?.[size] || [];
                return (
                  <div key={`${color}-${size}`} className="piece-group">
                    {piecesOfType.length > 0 ? (
                      <div className="piece-stack">
                        <TrianglePiece
                          color={color as GamePiece.Color}
                          size={size as 1 | 2 | 3}
                          displaySize="small"
                          onClick={() =>
                            onPieceClick && onPieceClick(piecesOfType[0]!)
                          }
                          isClickable={
                            isSetupPhase ||
                            (isTradeMode &&
                              validTradeIds.includes(piecesOfType[0]!.id)) ||
                            (isMoveMode &&
                              validMoveIds.includes(piecesOfType[0]!.id))
                          }
                          isSelected={false}
                          isDisabled={
                            (isTradeMode &&
                              !validTradeIds.includes(piecesOfType[0]!.id)) ||
                            (isMoveMode &&
                              !validMoveIds.includes(piecesOfType[0]!.id))
                          }
                        />
                        <span className="piece-count-badge">
                          {piecesOfType.length}
                        </span>
                      </div>
                    ) : (
                      <div className="empty-piece-slot" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bank;
