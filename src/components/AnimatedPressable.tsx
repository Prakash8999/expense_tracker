/**
 * AnimatedPressable — Premium tactile feedback wrapper
 *
 * Wraps any tappable element with a subtle scale-down on press
 * for a premium, native-feeling interaction.
 */

import React from 'react';
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

interface AnimatedPressableProps extends TouchableOpacityProps {
  /** Scale factor on press – defaults to 0.97 */
  scaleValue?: number;
  children: React.ReactNode;
}

export function AnimatedPressable({
  scaleValue = 0.97,
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      activeOpacity={0.85}
      onPressIn={(e) => {
        scale.value = withSpring(scaleValue, SPRING_CONFIG);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING_CONFIG);
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedTouchable>
  );
}
