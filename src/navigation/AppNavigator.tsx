// src/navigation/AppNavigator.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native'; // Import necessary components
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

// Import screens
import BasicCalculatorScreen from '../screens/BasicCalculatorScreen';
import ScientificCalculatorScreen from '../screens/ScientificCalculatorScreen';
import CurrencyConverterScreen from '../screens/CurrencyConverterScreen';
import UnitConverterScreen from '../screens/UnitConverterScreen';
import LoanCalculatorScreen from '../screens/LoanCalculatorScreen';
import GraphingCalculatorScreen from '../screens/GraphingCalculatorScreen';

import { useTheme, ThemeColors } from '../theme';

const Tab = createMaterialTopTabNavigator();

const AppNavigator = () => {
  const { theme } = useTheme(); // Get theme colors
  const styles = getNavigatorStyles(theme); // Function to get styles based on theme

  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarScrollEnabled: true,
      tabBarStyle: {
        backgroundColor: theme.surfaceVariant, // Background for the entire tab bar
        elevation: 0, // Remove shadow on Android for a flatter Material You look
        shadowOpacity: 0, // Remove shadow on iOS
        borderBottomWidth: 1,
        borderBottomColor: theme.outlineVariant,
      },
      tabBarActiveTintColor: theme.onPrimaryContainer, // Color for text & icon of active tab
      tabBarInactiveTintColor: theme.onSurfaceVariant, // Color for text & icon of inactive tab
      tabBarIndicatorStyle: {
        height: 0, // Hide the default indicator line
      },
      tabBarButton: (props) => {
        const isFocused = props.accessibilityState?.selected ?? false;
        const item = navItems.find(navItem => navItem.name === route.name);

        return (
          <TouchableOpacity
          {...props}
          style={[
            styles.tabBarItem,
            isFocused ? styles.tabBarItemActive : styles.tabBarItemInactive,
          ]}
          >
          <View style={styles.tabBarItemContent}>
          {item?.iconName && (
            <Icon
            name={item.iconName}
            size={16}
            color={isFocused ? theme.onPrimaryContainer : theme.onSurfaceVariant}
            style={styles.iconStyle}
            />
          )}
          <Text style={[
            styles.tabBarLabel,
            isFocused ? styles.tabBarLabelActive : styles.tabBarLabelInactive,
          ]}>
          {item?.label || route.name}
          </Text>
          </View>
          </TouchableOpacity>
        );
      },
    })}
    >
    {navItems.map(item => (
      <Tab.Screen
      key={item.name}
      name={item.name}
      component={item.component}
      // Options can be set here if needed, but tabBarButton handles most styling
      />
    ))}
    </Tab.Navigator>
  );
};

// Define navigation items here to be accessible by tabBarButton
const navItems = [
  { name: 'Basic', label: 'Basic', component: BasicCalculatorScreen, iconName: 'calculator' },
{ name: 'Scientific', label: 'Scientific', component: ScientificCalculatorScreen, iconName: 'flask' },
{ name: 'Currency', label: 'Currency', component: CurrencyConverterScreen, iconName: 'money-bill-wave' },
{ name: 'Unit', label: 'Unit', component: UnitConverterScreen, iconName: 'ruler-combined' },
{ name: 'Loan', label: 'Loan', component: LoanCalculatorScreen, iconName: 'hand-holding-usd' },
{ name: 'Graphing', label: 'Graphing', component: GraphingCalculatorScreen, iconName: 'chart-line' },
];

// Styles for the navigator
const getNavigatorStyles = (theme: ThemeColors) => StyleSheet.create({
  tabBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16, // Horizontal padding for the pill
    marginVertical: 6,     // Margin to create space for the "pill" effect
    marginHorizontal: 4,   // Margin between pills
    borderRadius: 20,      // Fully rounded pill shape
    height: 40,            // Fixed height for consistency
  },
  tabBarItemActive: {
    backgroundColor: theme.primaryContainer, // Active tab background
  },
  tabBarItemInactive: {
    backgroundColor: 'transparent', // Or theme.surfaceVariant if you want a subtle bg
  },
  tabBarItemContent: { // To layout icon and text inside the TouchableOpacity
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconStyle: {
    marginRight: 8, // Space between icon and label
  },
  tabBarLabel: {
    fontSize: 14,
    textTransform: 'none', // As per your web version's nav item text
    fontWeight: '500',
  },
  tabBarLabelActive: {
    color: theme.onPrimaryContainer,
  },
  tabBarLabelInactive: {
    color: theme.onSurfaceVariant,
  },
});

export default AppNavigator;
