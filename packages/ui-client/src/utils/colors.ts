import { GamePiece } from '@binary-homeworlds/engine';

/**
 * Get the CSS variable name for a color
 * This allows the color to be themed via CSS variables
 */
export const getColorVariable = (color: GamePiece.Color): string => {
  return `var(--color-${color})`;
};

/**
 * Get the fallback color value for a color
 * Used as fallback if CSS variables are not supported
 */
export const getFallbackColor = (color: GamePiece.Color): string => {
  switch (color) {
    case 'red':
      return '#ef4444';
    case 'yellow':
      return '#eab308';
    case 'green':
      return '#22c55e';
    case 'blue':
      return '#3b82f6';
    default:
      return '#64748b';
  }
};

/**
 * Get the color value with CSS variable and fallback
 */
export const getColorValue = (color: GamePiece.Color): string => {
  return getColorVariable(color);
};
