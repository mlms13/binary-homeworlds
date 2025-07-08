import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ColorScheme = 'default' | 'colorblind';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  confirmTurnActions: boolean;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setConfirmTurnActions: (confirm: boolean) => void;
  effectiveTheme: 'light' | 'dark'; // The actual theme being applied
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('binary-homeworlds-theme');
    return (saved as Theme) || 'system';
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('binary-homeworlds-color-scheme');
    return (saved as ColorScheme) || 'default';
  });

  const [confirmTurnActions, setConfirmTurnActions] = useState<boolean>(() => {
    const saved = localStorage.getItem('binary-homeworlds-confirm-actions');
    return saved === 'true';
  });

  // Determine the effective theme
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    'dark'
  );

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');

      const handleChange = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setEffectiveTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
  }, [effectiveTheme, colorScheme]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('binary-homeworlds-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('binary-homeworlds-color-scheme', colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    localStorage.setItem(
      'binary-homeworlds-confirm-actions',
      confirmTurnActions.toString()
    );
  }, [confirmTurnActions]);

  const value: ThemeContextType = {
    theme,
    colorScheme,
    confirmTurnActions,
    setTheme,
    setColorScheme,
    setConfirmTurnActions,
    effectiveTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
