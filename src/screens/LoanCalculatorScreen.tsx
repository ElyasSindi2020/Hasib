// src/screens/LoanCalculatorScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme, ThemeColors } from '../theme';

// Custom Radio Button component
interface RadioButtonProps {
  label: string;
  value: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  theme: ThemeColors;
}

const RadioButton: React.FC<RadioButtonProps> = ({ label, value, selectedValue, onSelect, theme }) => {
  const styles = getRadioStyles(theme); // Use a separate style getter for radio
  const isSelected = value === selectedValue;
  return (
    <TouchableOpacity
      style={[styles.radioButtonContainer, isSelected && styles.radioButtonContainerSelected]}
      onPress={() => onSelect(value)}
    >
      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
        {isSelected && <View style={styles.radioDot} />}
      </View>
      <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const getRadioStyles = (theme: ThemeColors) => StyleSheet.create({
    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 24, 
        borderWidth: 1,
        borderColor: theme.inputBorder,
        backgroundColor: theme.inputBackground,
        marginRight: 10,
        marginBottom: 10, 
    },
    radioButtonContainerSelected: {
        backgroundColor: theme.primaryContainer,
        borderColor: theme.primary,
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.outline,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioCircleSelected: {
        borderColor: theme.primary,
    },
    radioDot: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: theme.primary,
    },
    radioLabel: {
        fontSize: 14,
        color: theme.onSurfaceVariant, // Use a color that contrasts with inputBackground
    },
    radioLabelSelected: {
        color: theme.onPrimaryContainer,
        fontWeight: '500',
    }
});


const LoanCalculatorScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme); 

  const [loanAmount, setLoanAmount] = useState('10000');
  const [interestRate, setInterestRate] = useState('5');
  const [loanTerm, setLoanTerm] = useState('5');
  const [interestType, setInterestType] = useState<'compound' | 'simple'>('compound');
  const [monthlyPayment, setMonthlyPayment] = useState<string | null>(null);
  const [calculationDetails, setCalculationDetails] = useState('');
  const [error, setError] = useState('');

  const calculateLoan = useCallback(() => {
    setError('');
    // setMonthlyPayment(null); // Keep previous valid result until new one or error
    // setCalculationDetails('');

    const numLoanAmount = parseFloat(loanAmount);
    const numInterestRate = parseFloat(interestRate);
    const numLoanTermYears = parseFloat(loanTerm);

    if (isNaN(numLoanAmount) || numLoanAmount <= 0) {
      setError('Please enter a valid positive loan amount.');
      setMonthlyPayment(null); setCalculationDetails(''); return;
    }
    if (isNaN(numInterestRate) || numInterestRate < 0) {
      setError('Please enter a valid non-negative interest rate.');
      setMonthlyPayment(null); setCalculationDetails(''); return;
    }
    if (isNaN(numLoanTermYears) || numLoanTermYears <= 0) {
      setError('Please enter a valid positive loan term.');
      setMonthlyPayment(null); setCalculationDetails(''); return;
    }

    const totalPaymentsMonths = numLoanTermYears * 12;
    if (totalPaymentsMonths <= 0) {
      setError('Loan term must result in at least one payment.');
      setMonthlyPayment(null); setCalculationDetails(''); return;
    }

    let calculatedMonthlyPayment: number;
    let totalRepayment: number;
    let totalInterest: number;
    const secondaryMessagePrefix = interestType === 'simple' ? 'Simple Int. | ' : 'Compound Int. | ';

    if (interestType === 'simple') {
      const rateDecimal = numInterestRate / 100;
      totalInterest = numLoanAmount * rateDecimal * numLoanTermYears;
      totalRepayment = numLoanAmount + totalInterest;
      calculatedMonthlyPayment = totalRepayment / totalPaymentsMonths;
    } else { // Compound interest
      const monthlyInterestRateDecimal = (numInterestRate / 100) / 12;
      if (monthlyInterestRateDecimal === 0) {
        calculatedMonthlyPayment = numLoanAmount / totalPaymentsMonths;
      } else {
        const termPower = Math.pow(1 + monthlyInterestRateDecimal, totalPaymentsMonths);
        const numerator = numLoanAmount * monthlyInterestRateDecimal * termPower;
        const denominator = termPower - 1;
        if (denominator === 0) {
          setError('Calculation error (denominator is zero). Check inputs.');
          setMonthlyPayment(null); setCalculationDetails(''); return;
        }
        calculatedMonthlyPayment = numerator / denominator;
      }
      totalRepayment = calculatedMonthlyPayment * totalPaymentsMonths;
      totalInterest = totalRepayment - numLoanAmount;
    }
    
    if (isNaN(calculatedMonthlyPayment) || !isFinite(calculatedMonthlyPayment)) {
        setError('Could not calculate payment. Please check inputs.');
        setMonthlyPayment(null); setCalculationDetails(''); return;
    }

    setMonthlyPayment(`$${calculatedMonthlyPayment.toFixed(2)}`);
    setCalculationDetails(
      `${secondaryMessagePrefix}Total Repay: $${totalRepayment.toFixed(2)} | Total Interest: $${totalInterest.toFixed(2)}`
    );
  }, [loanAmount, interestRate, loanTerm, interestType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loanAmount.trim() !== '' && interestRate.trim() !== '' && loanTerm.trim() !== '') {
        calculateLoan();
      } else {
        // Clear results if any crucial input is empty
        setMonthlyPayment(null);
        setCalculationDetails('');
        setError('');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [loanAmount, interestRate, loanTerm, interestType, calculateLoan]);

  return (
    <ScrollView style={[styles.screenContainer, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>Loan Calculator</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loan Amount ($)</Text>
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            placeholder="e.g., 10000"
            placeholderTextColor={theme.textSecondary}
            value={loanAmount}
            onChangeText={setLoanAmount}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Annual Interest Rate (%)</Text>
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            placeholder="e.g., 5"
            placeholderTextColor={theme.textSecondary}
            value={interestRate}
            onChangeText={setInterestRate}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Loan Term (Years)</Text>
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            placeholder="e.g., 5"
            placeholderTextColor={theme.textSecondary}
            value={loanTerm}
            onChangeText={setLoanTerm}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interest Type</Text>
          <View style={styles.radioGroupContainer}>
            <RadioButton
              label="Compound"
              value="compound"
              selectedValue={interestType}
              onSelect={(val) => setInterestType(val as 'compound' | 'simple')}
              theme={theme}
            />
            <RadioButton
              label="Simple"
              value="simple"
              selectedValue={interestType}
              onSelect={(val) => setInterestType(val as 'compound' | 'simple')}
              theme={theme}
            />
          </View>
        </View>

        {error && <Text style={styles.errorMessage}>{error}</Text>}

        {(monthlyPayment !== null && !error) && (
          <View style={styles.resultDisplayContainer}>
            <Text style={styles.secondaryDisplay} numberOfLines={2} ellipsizeMode="tail">{calculationDetails || ' '}</Text>
            <Text style={styles.resultDisplay}>{monthlyPayment}</Text>
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
  radioGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    marginTop: 4,
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
    textAlign: 'right', 
    width: '100%',
  },
  resultDisplay: {
    color: theme.displayText,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right', 
    width: '100%',
  },
  errorMessage: {
    color: theme.errorText,
    fontWeight: '500',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default LoanCalculatorScreen;
