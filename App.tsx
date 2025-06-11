// App.tsx
import React, { useState, useCallback, useEffect, useMemo, useContext } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  // TouchableOpacity, // No longer needed for theme toggle button
  View,
  Appearance,
  useColorScheme as useRNColorScheme, // Rename to avoid conflict
  Platform,
} from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import AppNavigator from './src/navigation/AppNavigator'; // Import the navigator
import { LightThemeColors, DarkThemeColors, ThemeContext, ThemeColors } from './src/theme'; // Import theme structure

// ThemeProvider to be used by the whole app
const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useRNColorScheme(); // 'light', 'dark', or null
  // State to hold the current theme based on system, will update on Appearance change
  const [isSystemDarkMode, setIsSystemDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsSystemDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const currentThemeColors = useMemo(() =>
  isSystemDarkMode ? DarkThemeColors : LightThemeColors,
  [isSystemDarkMode]
  );

  const navigationTheme = useMemo(() => {
    const baseNavTheme = isSystemDarkMode ? NavigationDarkTheme : DefaultTheme;
    return {
      ...baseNavTheme,
      colors: {
        ...baseNavTheme.colors,
        primary: currentThemeColors.primary,
        background: currentThemeColors.background,
        card: currentThemeColors.surface,
        text: currentThemeColors.onSurface,
        border: currentThemeColors.outlineVariant,
      },
    };
  }, [isSystemDarkMode, currentThemeColors]);

  // The toggleTheme function is no longer needed as we follow system theme
  return (
    <ThemeContext.Provider value={{ theme: currentThemeColors, isDarkMode: isSystemDarkMode, toggleTheme: () => {} }}>
    <NavigationContainer theme={navigationTheme}>
    {children}
    </NavigationContainer>
    </ThemeContext.Provider>
  );
};


const AppHeader = () => {
  const { theme } = useContext(ThemeContext); // isDarkMode and toggleTheme no longer needed here
  const styles = getHeaderStyles(theme);

  return (
    <View style={styles.header}>
    <Text style={styles.headerTitle}>
    <Icon name="calculator" size={20} color={theme.textPrimary} /> My Calculator
    </Text>
    {/* Theme toggle button is removed */}
    </View>
  );
};

// This component will be the direct child of ThemeProvider
// It allows us to access the theme context for SafeAreaView's background
const AppContentWrapper = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
    <ThemedStatusBar />
    <AppHeader />
    <View style={{flex: 1}}>
    <AppNavigator />
    </View>
    </SafeAreaView>
  );
}

const App = () => {
  return (
    <AppThemeProvider>
    <AppContentWrapper />
    </AppThemeProvider>
  );
};

const ThemedStatusBar = () => {
  const { isDarkMode, theme } = useContext(ThemeContext);
  return (
    <StatusBar
    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
    backgroundColor={theme.background}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // paddingTop: Platform.OS === 'android' ? 10 : 0, // Example: Add 10 units of padding only on Android
  },
});

const getHeaderStyles = (theme: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Changed from 'center' to 'flex-start' to align title left
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
    // marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  // themeButton and themeButtonText styles are no longer needed
});

export default App;
