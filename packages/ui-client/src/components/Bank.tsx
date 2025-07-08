import React from 'react';
import { Piece, Color } from '@binary-homeworlds/shared';
import TrianglePiece from './TrianglePiece';
import './Bank.css';

interface BankProps {
  pieces: Piece[];
  onPieceClick?: (piece: Piece) => void;
  isSetupPhase?: boolean;
  selectedPieces?: Piece[];
  validTradeIds?: string[];
  isTradeMode?: boolean;
  validMoveIds?: string[];
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
      if (!acc[piece.color][piece.size]) {
        acc[piece.color][piece.size] = [];
      }
      acc[piece.color][piece.size].push(piece);
      return acc;
    },
    {} as Record<string, Record<number, Piece[]>>
  );

  // Define color order for consistent display
  const colorOrder: Color[] = ['red', 'yellow', 'green', 'blue'];
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
                          color={color}
                          size={size as 1 | 2 | 3}
                          displaySize="small"
                          onClick={() =>
                            onPieceClick && onPieceClick(piecesOfType[0])
                          }
                          isClickable={
                            isSetupPhase ||
                            (isTradeMode &&
                              validTradeIds.includes(piecesOfType[0].id)) ||
                            (isMoveMode &&
                              validMoveIds.includes(piecesOfType[0].id))
                          }
                          isSelected={false}
                          isDisabled={
                            (isTradeMode &&
                              !validTradeIds.includes(piecesOfType[0].id)) ||
                            (isMoveMode &&
                              !validMoveIds.includes(piecesOfType[0].id))
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
