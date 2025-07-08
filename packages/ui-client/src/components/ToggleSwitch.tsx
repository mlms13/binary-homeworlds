import React from 'react';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  id,
}) => {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <div className="toggle-switch-container">
      <label htmlFor={id} className="toggle-switch-label">
        {label}
      </label>
      <div className="toggle-switch" onClick={handleToggle}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={handleToggle}
          className="toggle-switch-input"
        />
        <span className="toggle-switch-slider">
          <span className="toggle-switch-thumb"></span>
        </span>
      </div>
    </div>
  );
};

export default ToggleSwitch;
