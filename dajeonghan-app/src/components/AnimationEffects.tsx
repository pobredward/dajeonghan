import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '@/constants';

interface SparkleEffectProps {
  x: number;
  y: number;
  show: boolean;
}

export const SparkleEffect: React.FC<SparkleEffectProps> = ({ x, y, show }) => {
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 500,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 500,
              easing: Easing.ease,
              useNativeDriver: false,
            }),
          ]),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [show]);

  if (!show) return null;

  const opacity = sparkleAnim;
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ opacity }}>
      <G rotation={rotate as any} origin={`${x}, ${y}`}>
        <Circle cx={x} cy={y - 25} r={3} fill="#FFD700" />
        <Circle cx={x + 20} cy={y - 15} r={2} fill="#FFD700" />
        <Circle cx={x + 20} cy={y + 15} r={2} fill="#FFD700" />
        <Circle cx={x} cy={y + 25} r={3} fill="#FFD700" />
        <Circle cx={x - 20} cy={y + 15} r={2} fill="#FFD700" />
        <Circle cx={x - 20} cy={y - 15} r={2} fill="#FFD700" />
      </G>
    </Animated.View>
  );
};

interface DustParticlesProps {
  x: number;
  y: number;
  show: boolean;
}

export const DustParticles: React.FC<DustParticlesProps> = ({ x, y, show }) => {
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      const createFloatAnimation = (animValue: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );

      createFloatAnimation(particle1, 0).start();
      createFloatAnimation(particle2, 1000).start();
      createFloatAnimation(particle3, 2000).start();
    }
  }, [show]);

  if (!show) return null;

  const translateY1 = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const translateY2 = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const translateY3 = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <G>
      <Animated.View style={{ transform: [{ translateY: translateY1 }] }}>
        <Circle cx={x - 10} cy={y - 10} r={2} fill="#A0826D" opacity={0.5} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: translateY2 }] }}>
        <Circle cx={x + 15} cy={y - 5} r={2} fill="#A0826D" opacity={0.5} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: translateY3 }] }}>
        <Circle cx={x + 5} cy={y + 10} r={2} fill="#A0826D" opacity={0.5} />
      </Animated.View>
    </G>
  );
};

interface PulseEffectProps {
  x: number;
  y: number;
  r: number;
  color: string;
  show: boolean;
}

export const PulseEffect: React.FC<PulseEffectProps> = ({ x, y, r, color, show }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [show]);

  if (!show) return null;

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View style={{ opacity }}>
      <Circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={2}
        scale={scale as any}
      />
    </Animated.View>
  );
};

interface CleaningEffectProps {
  x: number;
  y: number;
  show: boolean;
  onComplete?: () => void;
}

export const CleaningEffect: React.FC<CleaningEffectProps> = ({ x, y, show, onComplete }) => {
  const cleanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      Animated.sequence([
        Animated.timing(cleanAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: false,
        }),
        Animated.delay(500),
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }
  }, [show]);

  if (!show) return null;

  const scale = cleanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2],
  });

  const opacity = cleanAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.5, 0],
  });

  return (
    <Animated.View style={{ opacity }}>
      <G>
        <Circle cx={x} cy={y} r={10} fill="#4CAF50" opacity={0.3} scale={scale as any} />
        <Circle cx={x} cy={y} r={5} fill="#4CAF50" opacity={0.5} scale={scale as any} />
      </G>
    </Animated.View>
  );
};
