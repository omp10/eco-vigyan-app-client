export const LightTheme = {
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F7F8F7',
    primary: '#2E7D32', // AllTrails Green
    primarySoft: '#E8F5E9',
    primaryDeep: '#1B5E20',
    accent: '#FFA000',
    accentSoft: '#FFF8E1',
    text: '#212121',
    textMuted: '#757575',
    border: '#E0E0E0',
    trail: '#43A047',
    highlight: '#F1F8E9',
    warning: '#FB8C00',
    mapBlue: '#1976D2',
    danger: '#D32F2F',
    shadow: 'rgba(0, 0, 0, 0.08)',
    difficultyEasy: '#2E7D32',
    difficultyModerate: '#FBC02D',
    difficultyHard: '#D32F2F'
  },
};

export const DarkTheme = {
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceMuted: '#2C2C2C',
    primary: '#81C784', // Lighter green for dark mode accessibility
    primarySoft: '#1B321F',
    primaryDeep: '#A5D6A7',
    accent: '#FFB74D',
    accentSoft: '#3E2723',
    text: '#E0E0E0',
    textMuted: '#9E9E9E',
    border: '#333333',
    trail: '#66BB6A',
    highlight: '#1B5E20',
    warning: '#FFA726',
    mapBlue: '#42A5F5',
    danger: '#EF5350',
    shadow: 'rgba(0, 0, 0, 0.2)',
    difficultyEasy: '#81C784',
    difficultyModerate: '#FFB74D',
    difficultyHard: '#EF5350'
  },
};

// Default export as a functional getter to avoid massive refactoring in components
export const getAppTheme = (mode: 'light' | 'dark' = 'light') => mode === 'dark' ? DarkTheme : LightTheme;

// Keep AppTheme as a backward compatibility shim mapping to LightTheme
export const AppTheme = LightTheme;

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  }
};
