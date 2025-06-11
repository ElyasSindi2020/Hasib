// src/theme.ts
export const LightThemeColors = {
  primary: '#7B5A00',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFDF95',
  onPrimaryContainer: '#261A00',
  secondary: '#5A624B',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#DEE7C9',
  onSecondaryContainer: '#181E0C',
  tertiary: '#7A5552',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFDAD6',
  onTertiaryContainer: '#2E1313',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FFFBFF',
  onBackground: '#1E1C16',
  surface: '#FFFBFF',
  onSurface: '#1E1C16',
  surfaceVariant: '#E7E2D3',
  onSurfaceVariant: '#48473D',
  outline: '#7A786E',
  outlineVariant: '#CAC7B8',
  inverseSurface: '#33302A',
  inverseOnSurface: '#F6F1E9',
  inversePrimary: '#F6C749',
  // Custom additions for calculator based on your CSS
  textPrimary: '#1E1C16',
  textSecondary: '#48473D',
  buttonBackground: '#E7E2D3', // Similar to surface-variant-light
  buttonText: '#48473D',     // Similar to on-surface-variant-light
  operatorButtonBackground: '#FFDAD6', // Similar to tertiary-container-light
  operatorButtonText: '#2E1313',     // Similar to on-tertiary-container-light
  equalsButtonBackground: '#FFDF95',  // Similar to primary-container-light
  equalsButtonText: '#261A00',       // Similar to on-primary-container-light
  displayBackground: '#DEE7C9',      // Similar to secondary-container-light
  displayText: '#181E0C',           // Similar to on-secondary-container-light
  navItemBackground: '#FFFBFF', // surface-light
  navItemActiveBackground: '#FFDF95', // primary-container-light
  navItemText: '#48473D', // on-surface-variant-light
  navItemTextActive: '#261A00', // on-primary-container-light
  cardBackground: '#FFFBFF', // surface-light
  cardBorder: '#CAC7B8', // outline-variant-light
  inputBackground: '#FFFBFF', // surface-light
  inputBorder: '#7A786E', // outline-light
  inputText: '#1E1C16', // on-surface-light
  inputFocusBorder: '#7B5A00', // primary-light
  labelColor: '#48473D', // on-surface-variant-light
  errorText: '#BA1A1A', // error-light
};

export const DarkThemeColors = {
  primary: '#F6C749',
  onPrimary: '#3F2D00',
  primaryContainer: '#5B4300',
  onPrimaryContainer: '#FFDF95',
  secondary: '#C2CBAD',
  onSecondary: '#2D331F',
  secondaryContainer: '#434A35',
  onSecondaryContainer: '#DEE7C9',
  tertiary: '#ECB9B6',
  onTertiary: '#462725',
  tertiaryContainer: '#603D3B',
  onTertiaryContainer: '#FFDAD6',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#1E1C16',
  onBackground: '#E9E2DA',
  surface: '#1E1C16',
  onSurface: '#E9E2DA',
  surfaceVariant: '#48473D',
  onSurfaceVariant: '#CAC7B8',
  outline: '#949287',
  outlineVariant: '#48473D',
  inverseSurface: '#E9E2DA',
  inverseOnSurface: '#33302A',
  inversePrimary: '#7B5A00',
  // Custom additions for calculator based on your CSS
  textPrimary: '#E9E2DA',
  textSecondary: '#CAC7B8',
  buttonBackground: '#48473D',        // Similar to surface-variant-dark
  buttonText: '#CAC7B8',            // Similar to on-surface-variant-dark
  operatorButtonBackground: '#603D3B', // Similar to tertiary-container-dark
  operatorButtonText: '#FFDAD6',     // Similar to on-tertiary-container-dark
  equalsButtonBackground: '#5B4300',  // Similar to primary-container-dark
  equalsButtonText: '#FFDF95',       // Similar to on-primary-container-dark
  displayBackground: '#434A35',      // Similar to secondary-container-dark
  displayText: '#DEE7C9',           // Similar to on-secondary-container-dark
  navItemBackground: '#1E1C16', // surface-dark
  navItemActiveBackground: '#5B4300', // primary-container-dark
  navItemText: '#CAC7B8', // on-surface-variant-dark
  navItemTextActive: '#FFDF95', // on-primary-container-dark
  cardBackground: '#1E1C16', // surface-dark
  cardBorder: '#48473D', // outline-variant-dark
  inputBackground: '#1E1C16', // surface-dark
  inputBorder: '#949287', // outline-dark
  inputText: '#E9E2DA', // on-surface-dark
  inputFocusBorder: '#F6C749', // primary-dark
  labelColor: '#CAC7B8', // on-surface-variant-dark
  errorText: '#FFB4AB', // error-dark
};

export type ThemeColors = typeof LightThemeColors;

// Corrected ThemeContext import
import { createContext } from 'react';

export const ThemeContext = createContext<{
  theme: ThemeColors;
  isDarkMode: boolean;
  toggleTheme: () => void;
}>({
  theme: LightThemeColors,
  isDarkMode: false,
  toggleTheme: () => console.warn('ThemeProvider not found'),
});

// Corrected useTheme import
import { useContext } from 'react';

export const useTheme = () => useContext(ThemeContext);
