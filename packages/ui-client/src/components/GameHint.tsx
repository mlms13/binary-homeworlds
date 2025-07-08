import React from 'react';
import './GameHint.css';

interface GameHintProps {
  children: React.ReactNode;
  icon?: string;
}

const GameHint: React.FC<GameHintProps> = ({ children, icon = '💡' }) => {
  return (
    <div className="game-hint">
      {icon} {children}
    </div>
  );
};

export default GameHint;
