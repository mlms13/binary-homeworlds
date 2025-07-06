import React from 'react';
import { Piece, Color } from '../../../src/types';
import TrianglePiece from './TrianglePiece';
import './Bank.css';

interface BankProps {
  pieces: Piece[];
  onPieceClick?: (piece: Piece) => void;
  isSetupPhase?: boolean;
  selectedPieces?: Piece[];
}

const Bank: React.FC<BankProps> = ({
  pieces,
  onPieceClick,
  isSetupPhase = false,
  selectedPieces = [],
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
                          isClickable={isSetupPhase}
                          isSelected={selectedPieces.some(
                            p => p.color === color && p.size === size
                          )}
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
