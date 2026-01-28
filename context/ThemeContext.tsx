import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const CustomThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const theme = 'light';

  const toggleTheme = () => {
    // Theme switching disabled
    console.log('Theme switching is disabled');
  };

  useEffect(() => {
    // Enforce light mode on mount
    Appearance.setColorScheme('light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
