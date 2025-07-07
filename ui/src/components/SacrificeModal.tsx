import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Color,
  Size,
  MoveAction,
  CaptureAction,
  GrowAction,
  TradeAction,
} from '../../../src/types';
import './SacrificeModal.css';

interface SacrificeModalProps {
  sacrificedShipId: string;
  systemId: string;
  shipColor: Color;
  shipSize: Size;
  actionsRemaining: number;
  plannedActions: (MoveAction | CaptureAction | GrowAction | TradeAction)[];
  onComplete: () => void;
  onCancel: () => void;
  onAddAction: (
    action: MoveAction | CaptureAction | GrowAction | TradeAction
  ) => void;
  onRemoveAction: (index: number) => void;
}

const SacrificeModal: React.FC<SacrificeModalProps> = ({
  sacrificedShipId: _sacrificedShipId,
  systemId: _systemId,
  shipColor,
  shipSize,
  actionsRemaining,
  plannedActions,
  onComplete,
  onCancel,
  onAddAction: _onAddAction,
  onRemoveAction,
}) => {
  const [selectedActionType, setSelectedActionType] = useState<string>('');

  const getColorName = (color: Color): string => {
    const colorNames = {
      yellow: 'Yellow',
      green: 'Green',
      blue: 'Blue',
      red: 'Red',
    };
    return colorNames[color];
  };

  const getSizeName = (size: Size): string => {
    const sizeNames = {
      1: 'Small',
      2: 'Medium',
      3: 'Large',
    };
    return sizeNames[size];
  };

  const getActionTypeColor = (actionType: string): string => {
    const actionColors = {
      move: '#eab308',
      capture: '#dc2626',
      grow: '#16a34a',
      trade: '#2563eb',
    };
    return actionColors[actionType as keyof typeof actionColors] || '#6b7280';
  };

  const canAddMoreActions = actionsRemaining > 0;
  const canComplete = plannedActions.length > 0;

  return createPortal(
    <div className="sacrifice-modal-overlay">
      <div className="sacrifice-modal">
        <div className="sacrifice-modal-header">
          <h2>Plan Sacrifice Actions</h2>
          <button className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="sacrifice-info">
          <div className="sacrificed-ship-info">
            <h3>
              Sacrificing {getColorName(shipColor)} {getSizeName(shipSize)} Ship
            </h3>
            <p>
              You can perform {shipSize} {getColorName(shipColor).toLowerCase()}{' '}
              actions
            </p>
          </div>

          <div className="actions-counter">
            <span className="actions-used">{plannedActions.length}</span>
            <span className="actions-separator">/</span>
            <span className="actions-total">{shipSize}</span>
            <span className="actions-label">actions planned</span>
          </div>
        </div>

        <div className="planned-actions">
          <h4>Planned Actions</h4>
          {plannedActions.length === 0 ? (
            <p className="no-actions">No actions planned yet</p>
          ) : (
            <div className="actions-list">
              {plannedActions.map((action, index) => (
                <div key={index} className="planned-action">
                  <div
                    className="action-type-badge"
                    style={{ backgroundColor: getActionTypeColor(action.type) }}
                  >
                    {action.type}
                  </div>
                  <div className="action-details">
                    {/* TODO: Add action-specific details */}
                    Action {index + 1}
                  </div>
                  <button
                    className="remove-action-btn"
                    onClick={() => onRemoveAction(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="action-selection">
          <h4>Add Action</h4>
          {canAddMoreActions ? (
            <div className="action-type-buttons">
              <button
                className={`action-type-btn ${selectedActionType === 'move' ? 'selected' : ''}`}
                style={{ borderColor: getActionTypeColor('move') }}
                onClick={() => setSelectedActionType('move')}
                disabled={!canAddMoreActions}
              >
                Move
              </button>
              <button
                className={`action-type-btn ${selectedActionType === 'capture' ? 'selected' : ''}`}
                style={{ borderColor: getActionTypeColor('capture') }}
                onClick={() => setSelectedActionType('capture')}
                disabled={!canAddMoreActions}
              >
                Capture
              </button>
              <button
                className={`action-type-btn ${selectedActionType === 'grow' ? 'selected' : ''}`}
                style={{ borderColor: getActionTypeColor('grow') }}
                onClick={() => setSelectedActionType('grow')}
                disabled={!canAddMoreActions}
              >
                Grow
              </button>
              <button
                className={`action-type-btn ${selectedActionType === 'trade' ? 'selected' : ''}`}
                style={{ borderColor: getActionTypeColor('trade') }}
                onClick={() => setSelectedActionType('trade')}
                disabled={!canAddMoreActions}
              >
                Trade
              </button>
            </div>
          ) : (
            <p className="max-actions">Maximum actions planned</p>
          )}
        </div>

        <div className="sacrifice-modal-footer">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="complete-btn"
            onClick={onComplete}
            disabled={!canComplete}
          >
            Execute Sacrifice
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SacrificeModal;
