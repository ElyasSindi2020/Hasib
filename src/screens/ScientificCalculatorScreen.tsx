// src/screens/ScientificCalculatorScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useTheme, ThemeColors } from '../theme';
import { Parser } from 'expr-eval'; // For evaluating expressions

const ScientificCalculatorScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [displayValue, setDisplayValue] = useState('0');
  const [expression, setExpression] = useState('');
  const [isRadians, setIsRadians] = useState(false); // false for degrees, true for radians
  const [isInverse, setIsInverse] = useState(false);

  const updateDisplay = (currentValue: string, currentExpression: string) => {
    setDisplayValue(currentValue);
    setExpression(currentExpression);
  };

  const appendToDisplay = (input: string) => {
    if (displayValue === 'Error' || displayValue === 'Infinity' || displayValue === '-Infinity') {
      updateDisplay(input, expression + input); // Append to expression as well
      return;
    }
    // If display is '0' and input is not '.', replace '0'. Otherwise, append.
    // Also, if an operator was just pressed, new input should start fresh on displayValue for numbers.
    // This part needs to be smarter for full expression building.
    // For now, we primarily build the displayValue and use it for evaluation or function input.
    const newDisplayValue = (displayValue === '0' && input !== '.') ? input : displayValue + input;

    if (newDisplayValue.length > 25) return; // Limit display length
    updateDisplay(newDisplayValue, expression + input); // Append to expression
  };

  const clearDisplay = useCallback(() => {
    updateDisplay('0', '');
    setIsInverse(false);
  }, []);

  const backspace = useCallback(() => {
    if (displayValue === 'Error' || displayValue === 'Infinity' || displayValue === '-Infinity') {
      clearDisplay();
      return;
    }
    const newDisplayValue = displayValue.length > 1 ? displayValue.slice(0, -1) : '0';
    // Also update expression if it was mirroring displayValue
    const newExpression = expression.length > 1 ? expression.slice(0, -1) : '';
    updateDisplay(newDisplayValue, newExpression);
  }, [displayValue, expression, clearDisplay]);

  const toggleMode = (mode: 'deg' | 'rad') => {
    setIsRadians(mode === 'rad');
  };

  const toggleInverse = () => {
    setIsInverse(!isInverse);
  };

  const handleDirectFunction = useCallback((func: string) => {
    // This function handles operations that take the current displayValue as input
    // and replace it with the result (e.g., sin, cos, sqrt, log, ln, fact)
    // It also handles constants like pi and e.
    let currentValText = displayValue;
    let currentVal = parseFloat(currentValText);

    // Allow direct use of π and e as operands
    if (currentValText === 'π') currentVal = Math.PI;
    if (currentValText === 'e') currentVal = Math.E;

    if (isNaN(currentVal) && !['pi', 'e'].includes(func)) {
      if (displayValue !== '0' && displayValue !== 'Error') {
        // If current display is not a number (e.g. already an error or complex expression part)
        // and we are not inserting a constant, it might be an error or needs different handling.
        // For now, if it's not a number and not pi/e, we might want to just update display with the function itself
        appendToDisplay(func + '('); // Start function notation
        return;
      } else if (!['pi', 'e'].includes(func)) {
        updateDisplay('Error', 'Invalid input for function');
        return;
      }
    }


    let result: number | string = 'Error';
    let newExpressionPreview = ''; // For the secondary display

    const toAngle = (val: number) => isRadians ? val : (val * Math.PI / 180);
    const fromAngle = (val: number) => isRadians ? val : (val * 180 / Math.PI);

    try {
      switch (func) {
        case 'sin': result = isInverse ? fromAngle(Math.asin(currentVal)) : Math.sin(toAngle(currentVal)); newExpressionPreview = `${isInverse ? 'asin' : 'sin'}(${currentValText})`; break;
        case 'cos': result = isInverse ? fromAngle(Math.acos(currentVal)) : Math.cos(toAngle(currentVal)); newExpressionPreview = `${isInverse ? 'acos' : 'cos'}(${currentValText})`; break;
        case 'tan': result = isInverse ? fromAngle(Math.atan(currentVal)) : Math.tan(toAngle(currentVal)); newExpressionPreview = `${isInverse ? 'atan' : 'tan'}(${currentValText})`; break;
        case 'log': result = isInverse ? Math.pow(10, currentVal) : Math.log10(currentVal); newExpressionPreview = `${isInverse ? '10^' : 'log'}(${currentValText})`; break;
        case 'ln': result = isInverse ? Math.exp(currentVal) : Math.log(currentVal); newExpressionPreview = `${isInverse ? 'e^' : 'ln'}(${currentValText})`; break;
        case 'sqrt': result = isInverse ? Math.pow(currentVal, 2) : Math.sqrt(currentVal); newExpressionPreview = `${isInverse ? 'sqr' : '√'}(${currentValText})`; break;
        case 'x^y': appendToDisplay('^'); return; // Handled by expression evaluation
        case 'fact':
          if (Number.isInteger(currentVal) && currentVal >= 0 && currentVal <= 170) { // Factorial grows very fast
            let fact = 1;
            for (let i = 2; i <= currentVal; i++) fact *= i;
            result = fact;
            newExpressionPreview = `fact(${currentValText})`;
          } else {
            result = 'Error'; newExpressionPreview = `fact(${currentValText})`;
          }
          break;
        case 'pi': updateDisplay(String(Math.PI), expression + 'π'); return;
        case 'e': updateDisplay(String(Math.E), expression + 'e'); return;
        default:
          // For operators like +, -, *, /, (, ) that build an expression
          appendToDisplay(func);
          return;
      }

      if (isNaN(result as number) || !isFinite(result as number)) {
        result = 'Error';
      }
      updateDisplay(String(parseFloat((result as number).toPrecision(12))), `${newExpressionPreview} =`);
      if (func !== 'inv') setIsInverse(false);

    } catch (e) {
      updateDisplay('Error', '');
      setIsInverse(false);
    }
  }, [displayValue, expression, isRadians, isInverse]);

  const evaluateExpression = () => {
    if (displayValue === 'Error') return;
    try {
      let exprToEvaluate = expression // Use the accumulated expression
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e/g, `(${Math.E})`)
      .replace(/√\(/g, 'sqrt(') // Assuming parser handles sqrt
      .replace(/log\(/g, 'log10(') // Assuming parser handles log10
      .replace(/ln\(/g, 'log(');   // Assuming parser handles natural log as log

      // Note: expr-eval handles trig functions in radians by default.
      // If your expression string contains "sin(30)" and mode is degrees,
      // this simple replacement won't automatically convert 30 to radians for the parser.
      // A more robust solution would involve pre-processing the expression string
      // to convert degree-based function arguments to radians before parsing.
      // For now, this evaluate function assumes functions are used in radians or the parser handles it.

      const parser = new Parser({
        operators: {
          // You can add custom operators or override precedence if needed
          ...Parser.operators, // Include default operators
          '^': { precedence: 4, associativity: 'right', fn: (a: number, b: number) => Math.pow(a, b) },
        }
      });
      const result = parser.evaluate(exprToEvaluate);

      if (isNaN(result) || !isFinite(result)) {
        updateDisplay('Error', expression + ' =');
      } else {
        updateDisplay(String(parseFloat(result.toPrecision(12))), expression + ' =');
      }
    } catch (e) {
      updateDisplay('Error', expression + ' =');
    }
  };

  // Layout: Standard 4-column grid first, then scientific functions
  const standardButtonsLayout = [
    [
      { label: 'C', onPress: clearDisplay, styleKey: 'buttonSecondary' },
      { label: 'DEL', onPress: backspace, styleKey: 'buttonSecondary' },
      { label: '(', onPress: () => handleDirectFunction('('), styleKey: 'buttonOperator' },
               { label: ')', onPress: () => handleDirectFunction(')'), styleKey: 'buttonOperator' },
    ],
    [
      { label: '7', onPress: () => appendToDisplay('7') },
               { label: '8', onPress: () => appendToDisplay('8') },
               { label: '9', onPress: () => appendToDisplay('9') },
               { label: '÷', onPress: () => handleDirectFunction('/'), styleKey: 'buttonOperator' },
    ],
    [
      { label: '4', onPress: () => appendToDisplay('4') },
               { label: '5', onPress: () => appendToDisplay('5') },
               { label: '6', onPress: () => appendToDisplay('6') },
               { label: '×', onPress: () => handleDirectFunction('*'), styleKey: 'buttonOperator' },
    ],
    [
      { label: '1', onPress: () => appendToDisplay('1') },
               { label: '2', onPress: () => appendToDisplay('2') },
               { label: '3', onPress: () => appendToDisplay('3') },
               { label: '-', onPress: () => handleDirectFunction('-'), styleKey: 'buttonOperator' },
    ],
    [
      { label: '0', onPress: () => appendToDisplay('0'), span: 2 },
               { label: '.', onPress: () => appendToDisplay('.') },
               { label: '+', onPress: () => handleDirectFunction('+'), styleKey: 'buttonOperator' },
    ],
  ];

  const scientificFunctionsLayout = [
    [
      { label: isRadians ? 'deg' : 'rad', onPress: () => toggleMode(isRadians ? 'deg' : 'rad'), styleKey: 'buttonSmallText' },
               { label: 'Inv', onPress: toggleInverse, styleKey: isInverse ? 'buttonSmallTextActive' : 'buttonSmallText' },
               { label: 'sin', onPress: () => handleDirectFunction('sin'), styleKey: 'buttonSmallTextFunc' },
               { label: 'cos', onPress: () => handleDirectFunction('cos'), styleKey: 'buttonSmallTextFunc' },
               { label: 'tan', onPress: () => handleDirectFunction('tan'), styleKey: 'buttonSmallTextFunc' },
    ],
    [
      { label: 'xʸ', onPress: () => handleDirectFunction('^'), styleKey: 'buttonOperator' },
               { label: '√', onPress: () => handleDirectFunction('sqrt'), styleKey: 'buttonOperator' },
               { label: 'log', onPress: () => handleDirectFunction('log'), styleKey: 'buttonOperator' },
               { label: 'ln', onPress: () => handleDirectFunction('ln'), styleKey: 'buttonOperator' },
               { label: 'n!', onPress: () => handleDirectFunction('fact'), styleKey: 'buttonOperator' },
    ],
    [
      { label: 'π', onPress: () => handleDirectFunction('pi'), styleKey: 'buttonOperator' },
               { label: 'e', onPress: () => handleDirectFunction('e'), styleKey: 'buttonOperator' },
               { label: 'ANS', onPress: () => {/* TODO */}, styleKey: 'buttonOperator' }, // Placeholder
               { label: '=', onPress: evaluateExpression, styleKey: 'buttonEquals', span: 2 },
    ],
  ];

  const renderButtonGroup = (layout: any[][], numCols: number) => (
    layout.map((row, rowIndex) => (
      <View key={`row-${rowIndex}`} style={[styles.buttonRow, { marginHorizontal: -(styles.button(numCols).marginHorizontal) }]}>
      {row.map((button) => {
        const buttonSpecificStyle = button.styleKey ? styles[button.styleKey as keyof typeof styles] : {};
        // For flex-based span, the container (buttonRow) needs to be a flex container
        // and the button itself takes up flex units.
        const buttonBaseStyle = styles.button(numCols);
        const buttonSpanStyle = button.span ? { flexGrow: button.span, width: (buttonBaseStyle.width * button.span) + (buttonBaseStyle.marginHorizontal * 2 * (button.span -1)) } : {width: buttonBaseStyle.width};

        return (
          <TouchableOpacity
          key={button.label}
          style={[buttonBaseStyle, buttonSpecificStyle, buttonSpanStyle]}
          onPress={button.onPress}
          >
          <Text style={[
            styles.buttonText(numCols),
                button.styleKey === 'buttonOperator' && { color: theme.operatorButtonText },
                button.styleKey === 'buttonEquals' && { color: theme.equalsButtonText },
                (button.styleKey === 'buttonSecondary') && { color: theme.onSecondaryContainer }, // Use onSecondaryContainer for secondary buttons
                (!button.styleKey) && { color: theme.buttonText }, // Default numbers
                (button.styleKey === 'buttonSmallText' || button.styleKey === 'buttonSmallTextActive' || button.styleKey === 'buttonSmallTextFunc') && styles.smallButtonText(numCols),
          ]}>
          {button.label}
          </Text>
          </TouchableOpacity>
        );
      })}
      </View>
    ))
  );

  return (
    <ScrollView style={[styles.screenContainer, { backgroundColor: theme.background }]}>
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
    {renderButtonGroup(standardButtonsLayout, 4)}
    <View style={styles.scientificSectionSeparator} />
    {renderButtonGroup(scientificFunctionsLayout, 5)}
    </View>
    </View>
    </ScrollView>
  );
};

const getStyles = (theme: ThemeColors) => {
  const screenPadding = 10;
  const cardPadding = 15;
  const buttonRowMarginBottom = 10;

  // Function to calculate button styles based on number of columns
  const calculateButtonStyles = (numColumns: number) => {
    const buttonMarginHorizontal = numColumns === 4 ? 6 : 4; // Tighter for 5 columns
    const availableWidthForButtons = Dimensions.get('window').width - (2 * screenPadding) - (2 * cardPadding);
    const totalMarginSpace = (numColumns - 1) * buttonMarginHorizontal * 2;
    const buttonWidth = (availableWidthForButtons - totalMarginSpace) / numColumns;
    const buttonHeight = buttonWidth; // Square buttons

    return {
      width: buttonWidth,
      height: buttonHeight,
      borderRadius: buttonHeight / 2,
      marginHorizontal: buttonMarginHorizontal,
      fontSize: buttonHeight / (numColumns === 4 ? 2.5 : 3), // Adjust font based on columns
    };
  };

  const commonButtonStyles = calculateButtonStyles(4); // For standard grid
  const scientificButtonStyles = calculateButtonStyles(5); // For scientific grid

  return StyleSheet.create({
    screenContainer: {
      flex: 1,
      padding: screenPadding,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: cardPadding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      marginBottom: 20, // Space at the bottom
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
      // justifyContent: 'space-between', // Let margins handle spacing
    },
    // Dynamic button style function
    button: (numCols: number) => {
      const styles = numCols === 4 ? commonButtonStyles : scientificButtonStyles;
      return {
        height: styles.height,
        width: styles.width, // This will be overridden by flexGrow if span is used
        borderRadius: styles.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.buttonBackground,
        marginHorizontal: styles.marginHorizontal,
        elevation: 1,
      };
    },
    // Dynamic button text style function
    buttonText: (numCols: number) => {
      const styles = numCols === 4 ? commonButtonStyles : scientificButtonStyles;
      return {
        fontSize: styles.fontSize,
        color: theme.buttonText,
        fontWeight: '400',
      };
    },
    smallButtonText: (numCols: number) => { // For deg/rad/inv and function names
      const styles = numCols === 4 ? commonButtonStyles : scientificButtonStyles;
      return {
        fontSize: styles.fontSize * 0.8, // Slightly smaller than regular button text
      };
    },
    buttonSmallTextActive: {
      backgroundColor: theme.primaryContainer,
    },
    buttonSmallTextFunc: {
      backgroundColor: theme.secondaryContainer,
    },
    buttonSecondary: {
      backgroundColor: theme.secondaryContainer,
    },
    buttonOperator: {
      backgroundColor: theme.operatorButtonBackground,
    },
    buttonEquals: {
      backgroundColor: theme.equalsButtonBackground,
    },
    scientificSectionSeparator: {
      height: 1,
      backgroundColor: theme.outlineVariant,
      marginVertical: 15,
      marginHorizontal: 5,
    }
  });
};

export default ScientificCalculatorScreen;
