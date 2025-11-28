import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { GamePiece } from '@binary-homeworlds/engine';

import './ActionMenu.css';

interface ActionMenuProps {
  shipId: GamePiece.PieceId;
  systemId: string;
  position: { x: number; y: number };
  availableActions: ActionOption[];
  onClose: () => void;
  onAction: (action: string) => void;
}

interface ActionOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  color?: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  shipId: _shipId,
  systemId: _systemId,
  position,
  availableActions,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // Calculate optimal position considering viewport bounds
  const calculateOptimalPosition = (initialPosition: {
    x: number;
    y: number;
  }) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Estimate menu dimensions (will be refined after render)
    const estimatedMenuWidth = 200;
    const estimatedMenuHeight = Math.min(
      300,
      availableActions.length * 60 + 80
    );

    let { x, y } = initialPosition;

    // Adjust horizontal position
    if (x + estimatedMenuWidth > viewportWidth) {
      // Position to the left of the trigger point
      x = initialPosition.x - estimatedMenuWidth - 20;
    }
    if (x < 0) {
      // Ensure menu doesn't go off the left edge
      x = 10;
    }

    // Adjust vertical position
    if (y + estimatedMenuHeight > viewportHeight) {
      // Position above the trigger point
      y = initialPosition.y - estimatedMenuHeight - 10;
    }
    if (y < 0) {
      // Ensure menu doesn't go off the top edge
      y = 10;
    }

    return { x, y };
  };

  const [adjustedPosition, setAdjustedPosition] = useState(() =>
    calculateOptimalPosition(position)
  );

  // Fine-tune position after menu is rendered and we have actual dimensions
  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position with actual width
    if (x + menuRect.width > viewportWidth) {
      x = position.x - menuRect.width - 20;
    }
    if (x < 0) {
      x = 10;
    }

    // Adjust vertical position with actual height
    if (y + menuRect.height > viewportHeight) {
      y = position.y - menuRect.height - 10;
    }
    if (y < 0) {
      y = 10;
    }

    // Only update if position actually changed
    if (x !== adjustedPosition.x || y !== adjustedPosition.y) {
      setAdjustedPosition({ x, y });
    }
  }, [position, availableActions, adjustedPosition.x, adjustedPosition.y]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return createPortal(
    <div
      className="action-menu-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      <div
        ref={menuRef}
        className="action-menu"
        style={{
          position: 'absolute',
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
      >
        <div className="action-menu-header">
          <h4>Ship Actions</h4>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="action-menu-content">
          {availableActions.map(action => (
            <button
              key={action.id}
              className={`action-option ${action.enabled ? 'enabled' : 'disabled'}`}
              onClick={() => action.enabled && onAction(action.id)}
              disabled={!action.enabled}
              style={{
                borderLeftColor: action.color,
              }}
            >
              <div className="action-label">{action.label}</div>
              <div className="action-description">{action.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ActionMenu;
