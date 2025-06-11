// src/screens/BasicCalculatorScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useTheme, ThemeColors } from '../theme';

const BasicCalculatorScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [displayValue, setDisplayValue] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [operator, setOperator] = useState<string | null>(null);
  const [expression, setExpression] = useState(''); // For the secondary display

  const updateDisplayState = (newDisplay: string, newExpression: string) => {
    setDisplayValue(newDisplay);
    setExpression(newExpression);
  };

  const inputDigit = useCallback((digit: string) => {
    let newDisplayVal;
    if (waitingForSecondOperand) {
      newDisplayVal = digit;
      setWaitingForSecondOperand(false);
    } else {
      newDisplayVal = (displayValue === '0' && digit !== '.') ? digit : displayValue + digit;
    }
    if (newDisplayVal.length > 15) newDisplayVal = newDisplayVal.slice(0, 15);

    const newExpr = waitingForSecondOperand ? expression + digit : newDisplayVal;
    updateDisplayState(newDisplayVal, newExpr);

  }, [displayValue, waitingForSecondOperand, expression]);

  const inputDecimal = useCallback(() => {
    let newDisplayVal = displayValue;
    let newExpr = expression;
    if (waitingForSecondOperand) {
      newDisplayVal = '0.';
  newExpr += '0.';
  setWaitingForSecondOperand(false);
    } else {
      if (!newDisplayVal.includes('.')) {
        newDisplayVal += '.';
        newExpr += '.';
      }
    }
    updateDisplayState(newDisplayVal, newExpr);
  }, [displayValue, waitingForSecondOperand, expression]);

  const clearDisplay = useCallback(() => {
    updateDisplayState('0', '');
    setFirstOperand(null);
    setWaitingForSecondOperand(false);
    setOperator(null);
  }, []);

  const performCalculation = useCallback((): number | 'Error' => {
    const first = firstOperand;
    const op = operator;
    const second = parseFloat(displayValue);

    if (op === null || first === null) {
      return isNaN(second) ? 'Error' : second;
    }
    if (isNaN(first) || isNaN(second)) return 'Error';

    let result: number;
    switch (op) {
      case '+': result = first + second; break;
      case '-': result = first - second; break;
      case '*': result = first * second; break;
      case '/':
        if (second === 0) return 'Error';
        result = first / second;
      break;
      default: return 'Error'; // Should include % if implemented
    }
    return parseFloat(result.toPrecision(12));
  }, [operator, firstOperand, displayValue]);

  const getOperatorSymbol = (op: string | null) => {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
  };

  const handleOperator = useCallback((nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (operator && !waitingForSecondOperand) {
      const result = performCalculation();
      if (result === 'Error') {
        clearDisplay();
        updateDisplayState('Error', '');
        return;
      }
      const resultStr = String(result);
      setFirstOperand(result);
      setDisplayValue(resultStr);
      setExpression(`${resultStr} ${getOperatorSymbol(nextOperator)}`);
    } else {
      setFirstOperand(inputValue);
      setExpression(`${displayValue} ${getOperatorSymbol(nextOperator)}`);
    }
    setOperator(nextOperator);
    setWaitingForSecondOperand(true);
  }, [displayValue, operator, firstOperand, waitingForSecondOperand, expression, performCalculation, clearDisplay]);

  const calculate = useCallback(() => {
    if (firstOperand === null || operator === null) {
      if (displayValue !== 'Error') {
        updateDisplayState(displayValue, `${expression} =`);
      }
      setWaitingForSecondOperand(false);
      return;
    }

    const result = performCalculation();
    const opSymbol = getOperatorSymbol(operator);
    const finalExpression = `${firstOperand} ${opSymbol} ${displayValue} =`;

    if (result === 'Error') {
      updateDisplayState('Error', finalExpression);
      setFirstOperand(null);
    } else {
      const resultStr = String(result);
      updateDisplayState(resultStr, finalExpression);
      setFirstOperand(result);
    }
    setOperator(null);
    setWaitingForSecondOperand(false);
  }, [operator, firstOperand, displayValue, expression, waitingForSecondOperand, performCalculation]);


  const backspace = useCallback(() => {
    if (waitingForSecondOperand && operator) {
      return;
    }

    let newDisplayValue = displayValue;
    let newExpression = expression;

    if (newDisplayValue !== '0' && newDisplayValue !== 'Error') {
      newDisplayValue = newDisplayValue.slice(0, -1);
      if (newExpression.endsWith(displayValue)) {
        newExpression = newExpression.slice(0, newExpression.length - displayValue.length) + newDisplayValue;
      } else {
        newExpression = newExpression.slice(0, -1);
      }
    }

    if (newDisplayValue === '' || newDisplayValue === '-') {
      newDisplayValue = '0';
    }
    if (newExpression === '' && newDisplayValue !== '0') {
      newExpression = newDisplayValue;
    } else if (newDisplayValue === '0' && newExpression === '0') {
      newExpression = '';
    }
    newExpression = newExpression.trimRight();

    updateDisplayState(newDisplayValue, newExpression);
  }, [displayValue, expression, operator, waitingForSecondOperand]);

  const buttonsLayout = [
    [
      { label: 'C', onPress: clearDisplay, styleKey: 'buttonSecondary', span: 2 },
      // { label: 'DEL', onPress: backspace, styleKey: 'buttonSecondary' }, // DEL moved
      { label: '%', onPress: () => handleOperator('%'), styleKey: 'buttonOperator' },
      { label: '÷', onPress: () => handleOperator('/'), styleKey: 'buttonOperator' },
    ],
    [
      { label: '7', onPress: () => inputDigit('7') },
      { label: '8', onPress: () => inputDigit('8') },
      { label: '9', onPress: () => inputDigit('9') },
      { label: '×', onPress: () => handleOperator('*'), styleKey: 'buttonOperator' },
    ],
    [
      { label: '4', onPress: () => inputDigit('4') },
      { label: '5', onPress: () => inputDigit('5') },
      { label: '6', onPress: () => inputDigit('6') },
      { label: '-', onPress: () => handleOperator('-'), styleKey: 'buttonOperator' },
    ],
    [
      { label: '1', onPress: () => inputDigit('1') },
      { label: '2', onPress: () => inputDigit('2') },
      { label: '3', onPress: () => inputDigit('3') },
      { label: '+', onPress: () => handleOperator('+'), styleKey: 'buttonOperator' },
    ],
    [
      { label: '0', onPress: () => inputDigit('0'), span: 2 },
      { label: '.', onPress: inputDecimal },
      { label: 'DEL', onPress: backspace, styleKey: 'buttonSecondary' }, // DEL moved here
    ],
    [
      { label: '=', onPress: calculate, styleKey: 'buttonEquals', span: 4 }, // Full width equals
    ]
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
    <View style={styles.card}>
    <View style={styles.resultDisplayContainer}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollDisplayContent}>
    <Text style={styles.secondaryDisplay} numberOfLines={1}>{expression || ' '}</Text>
    </ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollDisplayContent}>
    <Text style={styles.resultDisplay} numberOfLines={1} adjustsFontSizeToFit>{displayValue}</Text>
    </ScrollView>
    </View>
    <View style={styles.buttonContainer}>
    {buttonsLayout.map((row, rowIndex) => (
      <View key={`row-${rowIndex}`} style={styles.buttonRow}>
      {row.map((button) => {
        const buttonSpecificStyle = button.styleKey ? styles[button.styleKey as keyof typeof styles] : {};
        const baseButtonStyleWithLayout = styles.button();

        const buttonSpanStyle = button.span ?
        {
          width: (buttonBaseStyles.width * button.span) + (buttonBaseStyles.actualGap * (button.span -1)),
        } :
        { /* width is already in baseButtonStyleWithLayout for non-spanned */ };

        return (
          <TouchableOpacity
          key={button.label}
          style={[baseButtonStyleWithLayout, buttonSpecificStyle, buttonSpanStyle]}
          onPress={button.onPress}
          >
          <Text style={[
            styles.buttonText(),
                button.styleKey === 'buttonOperator' && { color: theme.operatorButtonText },
                button.styleKey === 'buttonEquals' && { color: theme.equalsButtonText },
                (button.styleKey === 'buttonSecondary') && { color: theme.onSecondaryContainer },
                (!button.styleKey && button.label !== '.' && button.label !== '0') && { color: theme.buttonText },
                (button.label === '.' || button.label === '0') && { color: theme.buttonText }
          ]}>
          {button.label}
          </Text>
          </TouchableOpacity>
        );
      })}
      </View>
    ))}
    </View>
    </View>
    </View>
  );
};

let buttonBaseStyles: ReturnType<typeof calculateButtonStyles>;

const calculateButtonStyles = () => {
  const screenPadding = 10;
  const cardPadding = 15;
  const numColumns = 4;
  const actualGap = 12;

  const availableWidthForButtonsInCard = Dimensions.get('window').width - (2 * screenPadding) - (2 * cardPadding);
  const buttonWidth = (availableWidthForButtonsInCard - ((numColumns - 1) * actualGap)) / numColumns;
  const buttonHeight = buttonWidth;

  return {
    width: buttonWidth,
    height: buttonHeight,
    borderRadius: buttonHeight / 2,
    fontSize: buttonHeight / 2.5,
    actualGap: actualGap,
  };
};


const getStyles = (theme: ThemeColors) => {
  buttonBaseStyles = calculateButtonStyles();
  const buttonRowMarginBottom = buttonBaseStyles.actualGap;

  return StyleSheet.create({
    screenContainer: {
      flex: 1,
      padding: 10,
      justifyContent: 'flex-end',
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 15,
      paddingVertical: 15 + 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      marginBottom: 10,
    },
    resultDisplayContainer: {
      backgroundColor: theme.displayBackground,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 20,
      marginBottom: 25,
      minHeight: 110,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    scrollDisplayContent: {
      flexGrow: 1,
      justifyContent: 'flex-end'
    },
    secondaryDisplay: {
      color: theme.displayText,
      fontSize: 22,
      opacity: 0.75,
      marginBottom: 5,
      textAlign: 'right',
    },
    resultDisplay: {
      color: theme.displayText,
      fontSize: 50,
      fontWeight: '300',
      textAlign: 'right',
    },
    buttonContainer: {
      // Container for all button groups
    },
    buttonRow: {
      flexDirection: 'row',
      marginBottom: buttonRowMarginBottom,
      justifyContent: 'space-between',
    },
    button: () => ({
      height: buttonBaseStyles.height,
      width: buttonBaseStyles.width,
      borderRadius: buttonBaseStyles.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.buttonBackground,
      elevation: 1,
    }),
    buttonText: () => ({
      fontSize: buttonBaseStyles.fontSize,
      color: theme.buttonText,
      fontWeight: '400',
    }),
    buttonSecondary: {
      backgroundColor: theme.secondaryContainer,
    },
    buttonOperator: {
      backgroundColor: theme.operatorButtonBackground,
    },
    buttonEquals: {
      backgroundColor: theme.equalsButtonBackground,
      // Height can be slightly different for the full-width equals button if desired
      // height: buttonBaseStyles.height * 0.9,
      // borderRadius: buttonBaseStyles.height * 0.45,
    },
  });
};

export default BasicCalculatorScreen;
