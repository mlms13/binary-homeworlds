import React from 'react';
import { createPortal } from 'react-dom';

import './SettingsMenu.css';

import { useTheme } from '../contexts/ThemeContext.js';
import ToggleSwitch from './ToggleSwitch.js';

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
  const {
    theme,
    colorScheme,
    confirmTurnActions,
    setTheme,
    setColorScheme,
    setConfirmTurnActions,
  } = useTheme();

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
            <select
              className="setting-select"
              value={theme}
              onChange={e =>
                setTheme(e.target.value as 'system' | 'light' | 'dark')
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Color Scheme Setting */}
          <div className="setting-group">
            <label className="setting-label">Color Scheme</label>
            <select
              className="setting-select"
              value={colorScheme}
              onChange={e =>
                setColorScheme(e.target.value as 'default' | 'colorblind')
              }
            >
              <option value="default">Default</option>
              <option value="colorblind">Colorblind Friendly</option>
            </select>
          </div>

          {/* Turn Confirmation Setting */}
          <div className="setting-group">
            <ToggleSwitch
              checked={confirmTurnActions}
              onChange={setConfirmTurnActions}
              label="Confirm turn actions before passing to opponent"
              id="confirm-turn-actions"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsMenu;
