// src/screens/CurrencyConverterScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme, ThemeColors } from '../theme';
import Icon from 'react-native-vector-icons/FontAwesome5';

interface Rates {
  [key: string]: number;
}

interface Currencies {
  [key: string]: string;
}

const API_BASE_URL = 'https://api.frankfurter.app';

const CurrencyConverterScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [currencies, setCurrencies] = useState<Currencies>({});
  const [rates, setRates] = useState<Rates | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversionExpression, setConversionExpression] = useState('');

  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/currencies`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Currencies = await response.json();
      setCurrencies(data);
      // Set default "to" currency to something different if "from" is EUR (default base of API)
      if (fromCurrency === 'EUR' && data['USD']) {
        setToCurrency('USD');
      } else if (data['EUR']) {
        setToCurrency('EUR'); // Default to EUR if USD is the fromCurrency
      }

    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch currencies';
      setError(message);
      Alert.alert("Error", message);
    }
  }, [fromCurrency]);

  const fetchRates = useCallback(async (base: string) => {
    if (!base) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/latest?from=${base}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.rates) {
        setRates({ ...data.rates, [base]: 1 }); // Add base currency to rates with rate of 1
      } else {
        throw new Error('Rates not found in API response');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : `Failed to fetch rates for ${base}`;
      setError(message);
      setRates(null); // Clear rates on error
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  useEffect(() => {
    if (fromCurrency) {
      fetchRates(fromCurrency);
    }
  }, [fromCurrency, fetchRates]);

  const handleConvert = useCallback(() => {
    if (!rates || !rates[toCurrency]) {
      setError('Exchange rate not available for the selected currency.');
      setConvertedAmount(null);
      setConversionExpression('');
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive amount.');
      setConvertedAmount(null);
      setConversionExpression('');
      return;
    }

    const rate = rates[toCurrency];
    const result = numericAmount * rate;
    setConvertedAmount(result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setConversionExpression(`${numericAmount.toLocaleString()} ${fromCurrency} to ${toCurrency}`);
    setError(null);
  }, [amount, fromCurrency, toCurrency, rates]);

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    // Rates will be refetched due to useEffect on fromCurrency
    setConvertedAmount(null); // Clear previous result
    setConversionExpression('');
  };

  const currencyList = Object.entries(currencies).map(([code, name]) => ({
    label: `${code} - ${name}`,
    value: code,
  })).sort((a,b) => a.label.localeCompare(b.label)); // Sort alphabetically

  if (isLoading && Object.keys(currencies).length === 0) { // Initial full load
    return (
      <View style={[styles.screenContainer, styles.centered, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching currencies...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screenContainer, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContentContainer}>
    <View style={styles.card}>
    <Text style={styles.title}>Currency Exchange</Text>

    <View style={styles.inputGroup}>
    <Text style={styles.label}>Amount</Text>
    <TextInput
    style={styles.inputField}
    value={amount}
    onChangeText={setAmount}
    placeholder="Enter amount"
    placeholderTextColor={theme.onSurfaceVariant}
    keyboardType="numeric"
    />
    </View>

    <View style={styles.currencyRow}>
    <View style={styles.pickerContainer}>
    <Text style={styles.label}>From</Text>
    <View style={styles.pickerWrapper}>
    <Picker
    selectedValue={fromCurrency}
    onValueChange={(itemValue) => {
      setFromCurrency(itemValue);
      setConvertedAmount(null); // Clear result when base changes
      setConversionExpression('');
    }}
    style={styles.picker}
    dropdownIconColor={theme.onSurfaceVariant}
    >
    {currencyList.map(curr => <Picker.Item key={curr.value} label={curr.label} value={curr.value} color={theme.inputText} />)}
    </Picker>
    </View>
    </View>

    <TouchableOpacity onPress={handleSwapCurrencies} style={styles.swapButton}>
    <Icon name="exchange-alt" size={20} color={theme.primary} />
    </TouchableOpacity>

    <View style={styles.pickerContainer}>
    <Text style={styles.label}>To</Text>
    <View style={styles.pickerWrapper}>
    <Picker
    selectedValue={toCurrency}
    onValueChange={(itemValue) => {
      setToCurrency(itemValue);
      setConvertedAmount(null); // Clear result when target changes
      setConversionExpression('');
    }}
    style={styles.picker}
    dropdownIconColor={theme.onSurfaceVariant}
    >
    {/* Filter available "to" currencies based on fetched rates for the "from" currency */}
    {rates && Object.keys(rates)
      .map(code => ({label: `${code} - ${currencies[code] || code}`, value: code}))
      .sort((a,b) => a.label.localeCompare(b.label))
      .map(curr => <Picker.Item key={curr.value} label={curr.label} value={curr.value} color={theme.inputText} />)
    }
    {!rates && toCurrency && currencies[toCurrency] && // Show selected if rates not loaded yet
      <Picker.Item label={`${toCurrency} - ${currencies[toCurrency]}`} value={toCurrency} color={theme.inputText}/>
    }
    </Picker>
    </View>
    </View>
    </View>

    <TouchableOpacity
    style={[styles.convertButton, isLoading && styles.buttonDisabled]}
    onPress={handleConvert}
    disabled={isLoading}
    >
    {isLoading && rates === null ? ( // Show loading only if rates are being fetched for conversion
      <ActivityIndicator color={theme.onPrimary} />
    ) : (
      <Text style={styles.convertButtonText}>Convert</Text>
    )}
    </TouchableOpacity>

    {convertedAmount && (
      <View style={styles.resultDisplayContainer}>
      <Text style={styles.secondaryDisplay}>{conversionExpression}</Text>
      <Text style={styles.resultDisplay}>{convertedAmount}</Text>
      </View>
    )}
    {error && !isLoading && <Text style={styles.errorMessage}>{error}</Text>}

    </View>
    </ScrollView>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 10,
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: theme.labelColor,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerWrapper: {
    backgroundColor: theme.inputBackground,
    borderColor: theme.inputBorder,
    borderWidth: 1,
    borderRadius: 12,
  },
  picker: {
    height: 50,
    // color: theme.inputText, // Picker item color is set on Picker.Item
  },
  swapButton: {
    padding: 10,
    marginHorizontal: 10,
    marginTop: 20, // Align with labels
    // backgroundColor: theme.secondaryContainer,
    // borderRadius: 20,
  },
  convertButton: {
    backgroundColor: theme.primary,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: theme.outline,
  },
  convertButtonText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  resultDisplayContainer: {
    backgroundColor: theme.displayBackground,
    borderRadius: 18,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  secondaryDisplay: {
    color: theme.displayText,
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  resultDisplay: {
    color: theme.displayText,
    fontSize: 28,
    fontWeight: '600',
  },
  errorMessage: {
    color: theme.errorText,
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
});

export default CurrencyConverterScreen;
