import React from 'react';
import { createPortal } from 'react-dom';
import { Piece } from '@binary-homeworlds/shared';
import TrianglePiece from './TrianglePiece';
import './BankPieceSelector.css';

interface BankPieceSelectorProps {
  isOpen: boolean;
  title: string;
  bankPieces: Piece[];
  validPieceIds: string[];
  onPieceSelect: (piece: Piece) => void;
  onClose: () => void;
}

const BankPieceSelector: React.FC<BankPieceSelectorProps> = ({
  isOpen,
  title,
  bankPieces,
  validPieceIds,
  onPieceSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="bank-piece-selector-overlay" onClick={onClose}>
      <div className="bank-piece-selector" onClick={e => e.stopPropagation()}>
        <div className="bank-piece-selector-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="bank-piece-selector-content">
          <div className="bank-pieces-grid">
            {bankPieces.map(piece => {
              const isValid = validPieceIds.includes(piece.id);
              return (
                <div
                  key={piece.id}
                  className={`bank-piece-option ${isValid ? 'valid' : 'invalid'}`}
                  onClick={() => isValid && onPieceSelect(piece)}
                >
                  <TrianglePiece
                    color={piece.color}
                    size={piece.size}
                    displaySize="medium"
                    isClickable={isValid}
                  />
                  {!isValid && <div className="invalid-overlay">✗</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BankPieceSelector;
