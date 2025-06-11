// src/screens/GraphingCalculatorScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Parser } from 'expr-eval';
import { LineChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape'; // For curve types in LineChart
import { Defs, LinearGradient, Stop } from 'react-native-svg'; // For gradient fill
import { useTheme, ThemeColors } from '../theme';

const GraphingCalculatorScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [expression, setExpression] = useState('x^2');
  const [xMin, setXMin] = useState('-10');
  const [xMax, setXMax] = useState('10');
  const [plotData, setPlotData] = useState<{ x: number; y: number }[]>([]);
  const [error, setError] = useState('');
  const [yAxisData, setYAxisData] = useState<number[]>([]); // For YAxis ticks

  const screenWidth = Dimensions.get('window').width;
  // Calculate graphWidth based on card padding and screen percentage
  const cardHorizontalPadding = 20 * 2; // padding * 2 from getStyles card style
  const cardWidthPercentage = 0.95; // from getStyles card style
  const graphWidth = (screenWidth * cardWidthPercentage) - cardHorizontalPadding;


  const generatePlotData = useCallback(() => {
    setError('');
    const xMinVal = parseFloat(xMin);
    const xMaxVal = parseFloat(xMax);

    if (expression.trim() === '') {
      setError('Please enter a function.');
      setPlotData([]);
      setYAxisData([]);
      return;
    }
    if (isNaN(xMinVal) || isNaN(xMaxVal)) {
      setError('X Min and X Max must be valid numbers.');
      setPlotData([]);
      setYAxisData([]);
      return;
    }
    if (xMaxVal <= xMinVal) {
      setError('X Max must be greater than X Min.');
      setPlotData([]);
      setYAxisData([]);
      return;
    }

    try {
      const parser = new Parser();
      const expr = parser.parse(expression);
      const dataPoints: { x: number; y: number }[] = [];
      const numPoints = 100;
      const step = (xMaxVal - xMinVal) / (numPoints > 1 ? numPoints - 1 : 1);

      for (let i = 0; i < numPoints; i++) {
        const x = xMinVal + i * step;
        let yValue;
        try {
          yValue = expr.evaluate({ x: x });
          if (!isFinite(yValue)) {
            // For react-native-svg-charts, we can represent breaks by pushing null
            // However, the library might not handle {x: number, y: null} directly in its data prop for y-values.
            // A common approach is to split the data into segments if nulls are encountered.
            // For simplicity here, we'll just filter out non-finite points before setting plotData.
            // This might connect points across an asymptote, which is not ideal.
            // A more robust solution would involve segmenting data.
            continue;
          }
        } catch (evalError) {
          continue;
        }
        dataPoints.push({ x, y: yValue });
      }

      const finiteDataPoints = dataPoints.filter(p => isFinite(p.y));

      if (finiteDataPoints.length === 0 && numPoints > 0) {
        setError('No valid points to plot for this function and range.');
        setPlotData([]);
        setYAxisData([]);
        return;
      }

      setPlotData(finiteDataPoints);

      if (finiteDataPoints.length > 0) {
        const yValues = finiteDataPoints.map(p => p.y);
        const actualMinY = Math.min(...yValues);
        const actualMaxY = Math.max(...yValues);

        const yRange = actualMaxY - actualMinY;
        const tickCount = 5;
        let ticks: number[];

        if (yRange === 0) {
          ticks = [actualMinY -1, actualMinY, actualMinY + 1].filter(t => isFinite(t));
          if (ticks.length < 2 && isFinite(actualMinY)) ticks = [actualMinY]; // Handle single point case
          else if (ticks.length < 2) ticks = [-1,0,1]; // Default if actualMinY is not finite
        } else {
          const yStep = yRange / (tickCount -1);
          ticks = Array.from({length: tickCount}, (_, i) => actualMinY + i * yStep);
        }
        setYAxisData(ticks.filter(t => isFinite(t))); // Ensure all ticks are finite

      } else {
        setYAxisData([-1, 0, 1]);
      }

    } catch (e: any) {
      setError(`Error: ${e.message || 'Invalid expression'}`);
      setPlotData([]);
      setYAxisData([]);
    }
  }, [expression, xMin, xMax]);

  useEffect(() => {
    generatePlotData();
  }, [generatePlotData]);

  const LineGradient = () => (
    <Defs key={'gradient'}>
    <LinearGradient id={'gradient'} x1={'0%'} y1={'0%'} x2={'0%'} y2={'100%'}>
    <Stop offset={'0%'} stopColor={theme.primary} stopOpacity={0.8} />
    <Stop offset={'100%'} stopColor={theme.primary} stopOpacity={0.2} />
    </LinearGradient>
    </Defs>
  );

  return (
    <ScrollView style={[styles.screenContainer, { backgroundColor: theme.background }]} contentContainerStyle={{alignItems: 'center'}}>
    <View style={styles.card}>
    <Text style={styles.title}>Graphing Calculator</Text>

    <View style={styles.inputGroup}>
    <Text style={styles.label}>f(x) =</Text>
    <TextInput
    style={styles.inputField}
    value={expression}
    onChangeText={setExpression}
    placeholder="e.g., x^2, sin(x)"
    placeholderTextColor={theme.onSurfaceVariant}
    autoCapitalize="none"
    autoCorrect={false}
    onSubmitEditing={generatePlotData}
    />
    </View>

    <View style={styles.rangeContainer}>
    <View style={styles.rangeInputGroup}>
    <Text style={styles.label}>X Min:</Text>
    <TextInput
    style={styles.inputField}
    value={xMin}
    onChangeText={setXMin}
    placeholder="-10"
    placeholderTextColor={theme.onSurfaceVariant}
    keyboardType="numeric"
    onSubmitEditing={generatePlotData}
    />
    </View>
    <View style={styles.rangeInputGroup}>
    <Text style={styles.label}>X Max:</Text>
    <TextInput
    style={styles.inputField}
    value={xMax}
    onChangeText={setXMax}
    placeholder="10"
    placeholderTextColor={theme.onSurfaceVariant}
    keyboardType="numeric"
    onSubmitEditing={generatePlotData}
    />
    </View>
    </View>

    <TouchableOpacity style={styles.plotButton} onPress={generatePlotData}>
    <Text style={styles.plotButtonText}>Plot Graph</Text>
    </TouchableOpacity>

    {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

    <View style={styles.graphOuterContainer}>
    {plotData.length > 1 ? ( // Need at least 2 points to draw a line
      <View style={{ height: 300, flexDirection: 'row' }}>
      <YAxis
      data={yAxisData.length > 0 ? yAxisData : (plotData.length > 0 ? [Math.min(...plotData.map(p=>p.y)), Math.max(...plotData.map(p=>p.y))] : [-1,1])}
      contentInset={{ top: 20, bottom: 20 }}
      svg={{ fontSize: 10, fill: theme.onSurfaceVariant }}
      numberOfTicks={yAxisData.length > 1 ? yAxisData.length : 2}
      formatLabel={(value) => value.toFixed(1)}
      style={{ marginRight: 5 }}
      />
      <View style={{ flex: 1 }}>
      <LineChart
      style={{ flex: 1 }}
      data={plotData.map(p => p.y)}
      svg={{ stroke: theme.primary, strokeWidth: 2 }}
      // curve={shape.curveNatural} // Smoothing can be problematic with asymptotes
      contentInset={{ top: 20, bottom: 20, left: 5, right: 5 }}
      yMin={yAxisData.length > 0 ? Math.min(...yAxisData) : undefined} // Set yMin and yMax for better scale control
      yMax={yAxisData.length > 0 ? Math.max(...yAxisData) : undefined}
      >
      <Grid svg={{stroke: theme.outlineVariant, strokeOpacity: 0.5}} />
      {/* <LineGradient /> // Area under curve fill can be added if desired */}
      </LineChart>
      <XAxis
      style={{ height: 30 }}
      data={plotData.map(p => p.x)}
      xAccessor={({ item }) => item} // Access the x value from plotData items
      formatLabel={(value, index) => {
        const xPoints = plotData.map(p => p.x);
        if (index === 0 || index === Math.floor((xPoints.length -1) / 2) || index === xPoints.length - 1) {
          return xPoints[index]?.toFixed(1) || '';
        }
        return '';
      }}
      contentInset={{ left: 15, right: 15 }}
      svg={{ fontSize: 10, fill: theme.onSurfaceVariant }}
      // numberOfTicks={3} // Let it determine based on data or provide x-values directly
      />
      </View>
      </View>
    ) : (
      <View style={styles.graphPlaceholder}>
      <Text style={{ color: theme.onSurfaceVariant }}>
      {error ? error : (plotData.length <=1 && expression.trim() !== '' ? 'Not enough data to plot' : 'Enter function to plot')}
      </Text>
      </View>
    )}
    </View>
    </View>
    </ScrollView>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 20,
    width: '95%',
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: theme.labelColor,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rangeInputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  plotButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  plotButtonText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    color: theme.errorText,
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  graphOuterContainer: {
    height: 350,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    borderRadius: 12,
    backgroundColor: theme.surface,
    paddingVertical: 10, // Add padding for axes
    paddingHorizontal: 5,
  },
  graphPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default GraphingCalculatorScreen;
