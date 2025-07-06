import React from 'react';
import { Piece } from '../../../src/types';
import PieceComponent from './Piece';
import './Bank.css';

interface BankProps {
  pieces: Piece[];
}

const Bank: React.FC<BankProps> = ({ pieces }) => {
  // Group pieces by color and size for better display
  const groupedPieces = pieces.reduce(
    (acc, piece) => {
      const key = `${piece.color}-${piece.size}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(piece);
      return acc;
    },
    {} as Record<string, Piece[]>
  );

  return (
    <div className="bank">
      <div className="bank-header">
        <h3>Bank</h3>
        <span className="piece-count">{pieces.length} pieces</span>
      </div>
      <div className="bank-pieces">
        {Object.entries(groupedPieces).map(([key, piecesOfType]) => {
          return (
            <div key={key} className="piece-group">
              <div className="piece-stack">
                <PieceComponent piece={piecesOfType[0]} size="small" />
                <span className="piece-count-badge">{piecesOfType.length}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Bank;
