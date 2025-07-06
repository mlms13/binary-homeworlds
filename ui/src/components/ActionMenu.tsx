import React, { useEffect, useRef } from 'react';
import './ActionMenu.css';

interface ActionMenuProps {
  shipId: string;
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

  return (
    <div
      className="action-menu-overlay"
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
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, 0)',
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
    </div>
  );
};

export default ActionMenu;
