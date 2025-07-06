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
          {/* Theme Setting */}
          <div className="setting-group">
            <label className="setting-label">Theme</label>
            <select className="setting-select">
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Color Scheme Setting */}
          <div className="setting-group">
            <label className="setting-label">Color Scheme</label>
            <select className="setting-select">
              <option value="default">Default</option>
              <option value="colorblind">Colorblind Friendly</option>
            </select>
          </div>

          {/* Turn Confirmation Setting */}
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                className="setting-checkbox"
                defaultChecked={false}
              />
              Confirm turn actions before passing to opponent
            </label>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsMenu;
