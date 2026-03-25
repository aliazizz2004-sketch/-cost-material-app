import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { colors, darkColors } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

const Skeleton = ({ width, height, borderRadius = 8, style }) => {
  const { isDark } = useTheme();
  const tc = isDark ? darkColors : colors;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const backgroundColor = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
};

export default Skeleton;
