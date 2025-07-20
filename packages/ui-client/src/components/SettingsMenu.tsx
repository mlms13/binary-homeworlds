import React from 'react';
import { createPortal } from 'react-dom';

import './SettingsMenu.css';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  position,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="settings-menu-overlay" onClick={onClose}>
      <div
        className="settings-menu"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          transform: 'translate(-100%, 0)', // Position to the left of the button
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="settings-menu-header">
          <h4>Settings</h4>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-menu-content">
          <div className="setting-group">
            <label>Theme</label>
            <select defaultValue="dark">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Confirm Actions</label>
            <input type="checkbox" defaultChecked />
          </div>

          <div className="setting-group">
            <label>Show Hints</label>
            <input type="checkbox" defaultChecked />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsMenu;
