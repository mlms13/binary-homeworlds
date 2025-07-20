import React from 'react';
import { createPortal } from 'react-dom';

import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="confirmation-overlay" onClick={onCancel}>
      <div className="confirmation-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirmation-header">
          <h3>{title}</h3>
        </div>

        <div className="confirmation-content">
          <p>{message}</p>
        </div>

        <div className="confirmation-actions">
          <button
            className="confirmation-btn confirmation-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="confirmation-btn confirmation-btn-confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationDialog;
