// src/screens/UnitConverterScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme, ThemeColors } from '../theme';

interface Unit {
  name: string;
  value: string;
  factor?: number; // For direct conversion to a base unit
  // For temperature, factor is not used directly in the same way
}

interface UnitCategory {
  [key: string]: Unit[];
}

const unitsData: UnitCategory = {
  length: [
    { name: 'Meter (m)', value: 'meter', factor: 1 },
    { name: 'Kilometer (km)', value: 'kilometer', factor: 1000 },
    { name: 'Centimeter (cm)', value: 'centimeter', factor: 0.01 },
    { name: 'Millimeter (mm)', value: 'millimeter', factor: 0.001 },
    { name: 'Mile (mi)', value: 'mile', factor: 1609.34 },
    { name: 'Yard (yd)', value: 'yard', factor: 0.9144 },
    { name: 'Foot (ft)', value: 'foot', factor: 0.3048 },
    { name: 'Inch (in)', value: 'inch', factor: 0.0254 },
  ],
  mass: [
    { name: 'Kilogram (kg)', value: 'kilogram', factor: 1 },
    { name: 'Gram (g)', value: 'gram', factor: 0.001 },
    { name: 'Milligram (mg)', value: 'milligram', factor: 0.000001 },
    { name: 'Pound (lb)', value: 'pound', factor: 0.453592 },
    { name: 'Ounce (oz)', value: 'ounce', factor: 0.0283495 },
  ],
  temperature: [
    { name: 'Celsius (°C)', value: 'celsius' },
    { name: 'Fahrenheit (°F)', value: 'fahrenheit' },
    { name: 'Kelvin (K)', value: 'kelvin' },
  ],
  time: [
    { name: 'Second (s)', value: 'second', factor: 1 },
    { name: 'Minute (min)', value: 'minute', factor: 60 },
    { name: 'Hour (hr)', value: 'hour', factor: 3600 },
    { name: 'Day (d)', value: 'day', factor: 86400 },
    // { name: 'Week (wk)', value: 'week', factor: 604800 }, // Can add more
    // { name: 'Year (yr)', value: 'year', factor: 31557600 }
  ],
  area: [
    { name: 'Square Meter (m²)', value: 'sq_meter', factor: 1 },
    { name: 'Square Kilometer (km²)', value: 'sq_kilometer', factor: 1e6 },
    { name: 'Square Foot (ft²)', value: 'sq_foot', factor: 0.092903 },
    // { name: 'Acre (ac)', value: 'acre', factor: 4046.86 },
    // { name: 'Hectare (ha)', value: 'hectare', factor: 10000 },
  ],
  volume: [
    { name: 'Cubic Meter (m³)', value: 'cubic_meter', factor: 1 },
    { name: 'Liter (L)', value: 'liter', factor: 0.001 },
    { name: 'Milliliter (mL)', value: 'milliliter', factor: 1e-6 },
    // { name: 'US Gallon (gal)', value: 'gallon_us', factor: 0.00378541 },
    // { name: 'Cubic Foot (ft³)', value: 'cubic_foot', factor: 0.0283168 },
  ]
};

const unitCategories = Object.keys(unitsData).map(key => ({
    label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
    value: key,
}));


const UnitConverterScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [inputValue, setInputValue] = useState('1');
  const [fromUnitType, setFromUnitType] = useState('length');
  const [fromUnit, setFromUnit] = useState(unitsData.length[0].value); // Default to first unit of length
  const [toUnitType, setToUnitType] = useState('length');
  const [toUnit, setToUnit] = useState(unitsData.length[1].value); // Default to second unit of length
  const [convertedValue, setConvertedValue] = useState<string | null>(null);
  const [conversionInfo, setConversionInfo] = useState('');
  const [error, setError] = useState('');

  const getUnitsForType = (type: string): Unit[] => unitsData[type] || [];

  useEffect(() => {
    // Update 'fromUnit' when 'fromUnitType' changes
    const availableFromUnits = getUnitsForType(fromUnitType);
    if (availableFromUnits.length > 0 && !availableFromUnits.find(u => u.value === fromUnit)) {
      setFromUnit(availableFromUnits[0].value);
    }
  }, [fromUnitType, fromUnit]);

  useEffect(() => {
    // Update 'toUnit' when 'toUnitType' changes
    const availableToUnits = getUnitsForType(toUnitType);
    if (availableToUnits.length > 0 && !availableToUnits.find(u => u.value === toUnit)) {
      setToUnit(availableToUnits[0].value);
    }
  }, [toUnitType, toUnit]);


  const handleConvert = useCallback(() => {
    setError('');
    setConvertedValue(null);
    setConversionInfo('');

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setError('Please enter a valid numeric value.');
      return;
    }

    if (fromUnitType !== toUnitType && fromUnitType !== 'temperature' && toUnitType !== 'temperature') {
      // Allow conversion between different types only if they are compatible (e.g. length to area not directly supported by this logic)
      // This simple converter primarily handles same-type conversions or temperature.
      // For more complex cross-type conversions, more sophisticated logic/factors would be needed.
      if(fromUnitType !== toUnitType) {
        setError('Cross-unit type conversion not supported for these types.');
        return;
      }
    }

    let finalConvertedValue: number | string;

    if (fromUnitType === 'temperature') {
      if (fromUnit === toUnit) {
        finalConvertedValue = value;
      } else if (fromUnit === 'celsius') {
        finalConvertedValue = (toUnit === 'fahrenheit') ? (value * 9/5) + 32 : value + 273.15;
      } else if (fromUnit === 'fahrenheit') {
        finalConvertedValue = (toUnit === 'celsius') ? (value - 32) * 5/9 : (value - 32) * 5/9 + 273.15;
      } else { // from Kelvin
        finalConvertedValue = (toUnit === 'celsius') ? value - 273.15 : (value - 273.15) * 9/5 + 32;
      }
    } else {
      const fromUnitData = getUnitsForType(fromUnitType).find(u => u.value === fromUnit);
      const toUnitData = getUnitsForType(toUnitType).find(u => u.value === toUnit);

      if (!fromUnitData?.factor || !toUnitData?.factor) {
        setError('Unit conversion factors not found.');
        return;
      }
      const valueInBaseUnit = value * fromUnitData.factor;
      finalConvertedValue = valueInBaseUnit / toUnitData.factor;
    }

    if (typeof finalConvertedValue === 'number' && (isNaN(finalConvertedValue) || !isFinite(finalConvertedValue))) {
        setError('Calculation error.');
        return;
    }
    
    const fromUnitName = getUnitsForType(fromUnitType).find(u => u.value === fromUnit)?.name || fromUnit;
    const toUnitName = getUnitsForType(toUnitType).find(u => u.value === toUnit)?.name || toUnit;

    setConvertedValue(Number(finalConvertedValue).toLocaleString(undefined, { maximumFractionDigits: 5 }));
    setConversionInfo(`${value.toLocaleString()} ${fromUnitName} to ${toUnitName}`);

  }, [inputValue, fromUnitType, fromUnit, toUnitType, toUnit]);

    // Auto-convert on change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue) { // Only convert if there's an input value
                 handleConvert();
            }
        }, 300); // Debounce
        return () => clearTimeout(timer);
    }, [inputValue, fromUnit, toUnit, handleConvert]);


  return (
    <ScrollView style={[styles.screenContainer, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>Unit Conversion</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Value</Text>
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            placeholder="Enter value"
            placeholderTextColor={theme.textSecondary}
            value={inputValue}
            onChangeText={setInputValue}
            maxLength={15}
          />
        </View>

        <View style={styles.conversionRow}>
          {/* From Unit Section */}
          <View style={styles.unitColumn}>
            <Text style={styles.label}>From</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={fromUnitType}
                onValueChange={(itemValue) => {
                  setFromUnitType(itemValue);
                  // setFromUnit(getUnitsForType(itemValue)[0]?.value); // Auto-select first unit of new type
                }}
                style={styles.picker}
                dropdownIconColor={theme.onSurfaceVariant}
              >
                {unitCategories.map(cat => (
                  <Picker.Item key={cat.value} label={cat.label} value={cat.value} color={theme.inputText} />
                ))}
              </Picker>
            </View>
            <View style={[styles.pickerContainer, {marginTop: 8}]}>
              <Picker
                selectedValue={fromUnit}
                onValueChange={(itemValue) => setFromUnit(itemValue)}
                style={styles.picker}
                dropdownIconColor={theme.onSurfaceVariant}
                enabled={getUnitsForType(fromUnitType).length > 0}
              >
                {getUnitsForType(fromUnitType).map(u => (
                  <Picker.Item key={u.value} label={u.name} value={u.value} color={theme.inputText} />
                ))}
              </Picker>
            </View>
          </View>

          {/* To Unit Section */}
          <View style={styles.unitColumn}>
            <Text style={styles.label}>To</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={toUnitType}
                onValueChange={(itemValue) => {
                  setToUnitType(itemValue);
                  // setToUnit(getUnitsForType(itemValue)[0]?.value); // Auto-select first unit of new type
                }}
                style={styles.picker}
                dropdownIconColor={theme.onSurfaceVariant}
              >
                {unitCategories.map(cat => (
                  <Picker.Item key={cat.value} label={cat.label} value={cat.value} color={theme.inputText} />
                ))}
              </Picker>
            </View>
            <View style={[styles.pickerContainer, {marginTop: 8}]}>
              <Picker
                selectedValue={toUnit}
                onValueChange={(itemValue) => setToUnit(itemValue)}
                style={styles.picker}
                dropdownIconColor={theme.onSurfaceVariant}
                enabled={getUnitsForType(toUnitType).length > 0}
              >
                {getUnitsForType(toUnitType).map(u => (
                  <Picker.Item key={u.value} label={u.name} value={u.value} color={theme.inputText} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        
        {/* Convert button can be removed if auto-conversion is preferred */}
        {/* <TouchableOpacity style={styles.convertButton} onPress={handleConvert}>
          <Text style={styles.convertButtonText}>Convert</Text>
        </TouchableOpacity> */}

        {error && <Text style={styles.errorMessage}>{error}</Text>}

        {(convertedValue !== null && !error) && (
          <View style={styles.resultDisplayContainer}>
            <Text style={styles.secondaryDisplay}>{conversionInfo || ' '}</Text>
            <Text style={styles.resultDisplay}>{convertedValue}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.labelColor,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: theme.inputBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    color: theme.inputText,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 50,
  },
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  unitColumn: {
    flex: 1,
    marginHorizontal: 5, // Add some spacing between columns
  },
  pickerContainer: {
    backgroundColor: theme.inputBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    color: theme.inputText,
  },
  convertButton: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 8,
  },
  convertButtonText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  resultDisplayContainer: {
    backgroundColor: theme.displayBackground,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  secondaryDisplay: {
    color: theme.displayText,
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  resultDisplay: {
    color: theme.displayText,
    fontSize: 28,
    fontWeight: '700',
  },
  errorMessage: {
    color: theme.errorText,
    fontWeight: '500',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default UnitConverterScreen;
