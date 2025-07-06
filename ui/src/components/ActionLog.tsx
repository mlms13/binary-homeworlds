import React from 'react';
import { GameAction } from '../../../src/types';
import './ActionLog.css';

interface ActionLogProps {
  isOpen: boolean;
  onClose: () => void;
  actions: GameAction[];
}

const ActionLog: React.FC<ActionLogProps> = ({ isOpen, onClose, actions }) => {
  const formatAction = (action: GameAction): string => {
    switch (action.type) {
      case 'setup':
        return `${action.player} set up their home system`;
      case 'move':
        return `${action.player} moved ship to ${action.toSystemId || 'new system'}`;
      case 'capture':
        return `${action.player} captured a ship`;
      case 'grow':
        return `${action.player} grew a new ship`;
      case 'trade':
        return `${action.player} traded ship color`;
      case 'sacrifice':
        return `${action.player} sacrificed ship for ${action.followupActions.length} actions`;
      case 'overpopulation':
        return `${action.player} declared overpopulation`;
      default:
        return `${action.player} performed an action`;
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`action-log ${isOpen ? 'open' : 'closed'}`}>
      <div className="action-log-header">
        <h3>Action Log</h3>
        <button className="close-btn" onClick={onClose}>
          →
        </button>
      </div>

      <div className="action-log-content">
        {actions.length === 0 ? (
          <div className="no-actions">No actions yet. Start playing!</div>
        ) : (
          <div className="actions-list">
            {actions.map((action, index) => (
              <div key={index} className="action-item">
                <div className="action-text">{formatAction(action)}</div>
                <div className="action-timestamp">
                  {formatTimestamp(action.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionLog;
