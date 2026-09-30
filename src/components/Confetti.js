import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import { FAN } from '../theme';

const COUNT = 90;

// Confetti rain. Each piece has its own start delay, fall speed, sway and
// flutter, so pieces spread over the whole screen instead of falling as a band.
// Pass a changing `burstKey` to fire it.
export default function Confetti({ burstKey }) {
  const { width, height } = useWindowDimensions();
  const [pieces, setPieces] = useState(null);
  const anims = useRef([]);

  useEffect(() => {
    if (!burstKey) return;
    const ps = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random() * width,
      startY: -20 - Math.random() * height * 0.25,
      sway: 15 + Math.random() * 35,
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 9,
      spin: (Math.random() < 0.5 ? -1 : 1) * (270 + Math.random() * 540),
      flips: 2 + Math.floor(Math.random() * 4),
      color: FAN[i % FAN.length],
      round: Math.random() < 0.25,
      delay: Math.random() * 900,
      duration: 2200 + Math.random() * 1400,
    }));
    anims.current = ps.map(() => new Animated.Value(0));
    setPieces(ps);
    Animated.parallel(
      ps.map((p, i) =>
        Animated.timing(anims.current[i], {
          toValue: 1,
          delay: p.delay,
          duration: p.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    ).start(() => setPieces(null));
  }, [burstKey]);

  if (!pieces) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
      {pieces.map((p, i) => {
        const v = anims.current[i];
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.startY,
              width: p.w,
              height: p.h,
              borderRadius: p.round ? p.w : 2,
              backgroundColor: p.color,
              opacity: v.interpolate({ inputRange: [0, 0.02, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height - p.startY + 40] }) },
                {
                  translateX: v.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [0, p.sway, 0, -p.sway, 0],
                  }),
                },
                { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
                { rotateX: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.flips * 360}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
