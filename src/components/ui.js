import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  Animated,
  Easing,
  BackHandler,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme } from '../theme';

export const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const success = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

// Background gradient used by every full screen.
export function Screen({ children, style }) {
  const t = useTheme();
  return (
    <LinearGradient colors={[t.bgTop, t.bgBottom]} style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
}

// Full-screen page that slides in over the app inside the same window.
// Used instead of <Modal> for Leaderboards/History: on Android a Modal opens a
// new native window, which is what caused the hitch when opening them.
export function Overlay({ visible, onClose, children }) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(width)).current;
  const [mounted, setMounted] = useState(visible);
  const show = visible || mounted;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      x.setValue(width);
      Animated.timing(x, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(x, {
        toValue: width,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible]);

  // Android back button closes the page instead of leaving the app.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!show) return null;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: 20, elevation: 20, transform: [{ translateX: x }] }]}
    >
      {children}
    </Animated.View>
  );
}

// Flat pill button. Feedback is instant (opacity + tiny scale), no press-down travel.
export function Button({ label, icon, onPress, color, textColor = '#fff', small, style, disabled }) {
  const t = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPressIn={tap}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: disabled ? '#B8B8B8' : color || t.accent,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          borderRadius: 999,
          paddingHorizontal: small ? 14 : 18,
          height: small ? 36 : 46,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
        },
        style,
      ]}
    >
      {icon ? <Text style={{ fontSize: small ? 15 : 17 }}>{icon}</Text> : null}
      {label ? (
        <Text style={{ color: textColor, fontFamily: FONT.display, fontSize: small ? 15 : 17 }}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

// Light translucent pill used for icon buttons on the coloured background.
export const LIGHT_PILL = 'rgba(255,255,255,0.25)';

// Icon (+ optional label) pill button.
export function PillItem({ icon, label, onPress, height = 40, bg = 'transparent', style }) {
  return (
    <Pressable
      onPressIn={tap}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height,
        minWidth: height,
        paddingHorizontal: label ? 12 : 0,
        borderRadius: height / 2,
        backgroundColor: bg,
        opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      {label ? (
        <Text style={{ fontFamily: FONT.display, fontSize: 15, color: '#fff' }}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

// Dark rounded bar holding PillItems.
export function PillBar({ children, style }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: t.shade,
          borderRadius: 999,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Round icon button for headers.
export function IconButton({ glyph, onPress, size = 40, style }) {
  const t = useTheme();
  return (
    <Pressable
      onPressIn={tap}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed ? 'rgba(255,255,255,0.4)' : t.chip,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.45, fontFamily: FONT.display }}>{glyph}</Text>
    </Pressable>
  );
}

// Cream rounded card with a soft shadow.
export function Card({ children, style, onPress, glow }) {
  const t = useTheme();
  const base = {
    backgroundColor: t.cream,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    // Border is always present (transparent when not glowing): toggling it on a
    // live view leaves a stale square shadow outline on Android.
    borderWidth: 2,
    borderColor: glow ? t.yellow : 'transparent',
  };
  // key forces a fresh native view when glow flips, so the shadow re-clips.
  const key = glow ? 'glow' : 'plain';
  if (onPress)
    return (
      <Pressable key={key} onPress={onPress} style={[base, style]}>
        {children}
      </Pressable>
    );
  return (
    <View key={key} style={[base, style]}>
      {children}
    </View>
  );
}

// Segmented pill toggle. options: [{key,label}]
export function Segmented({ options, value, onChange, style }) {
  const t = useTheme();
  return (
    <View
      style={[
        { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20, padding: 3 },
        style,
      ]}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              tap();
              onChange(o.key);
            }}
            style={{
              flex: 1,
              paddingVertical: 7,
              paddingHorizontal: 8,
              borderRadius: 17,
              backgroundColor: on ? t.yellow : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: FONT.display,
                fontSize: 14,
                color: on ? t.shade : 'rgba(255,255,255,0.85)',
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TextField({ label, style, ...props }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 8 }}>
      {label ? (
        <Text style={{ fontFamily: FONT.bold, fontSize: 12, color: t.inkSoft, marginBottom: 4 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#A7A39A"
        {...props}
        style={[
          {
            backgroundColor: '#fff',
            borderRadius: 12,
            borderWidth: 2,
            borderColor: 'rgba(0,0,0,0.1)',
            paddingHorizontal: 12,
            paddingVertical: Platform.OS === 'ios' ? 11 : 8,
            fontSize: 16,
            fontFamily: FONT.body,
            color: t.ink,
          },
          style,
        ]}
      />
    </View>
  );
}

// Centered dialog. buttons: [{label, onPress, primary, danger}]
export function Dialog({ visible, title, onClose, children, buttons = [] }) {
  const t = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: t.overlay, justifyContent: 'center', padding: 24 }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: t.cream, borderRadius: 22, padding: 18 }}
        >
          <Text style={{ fontFamily: FONT.display, fontSize: 22, color: t.ink }}>{title}</Text>
          {children}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
            {buttons.map((b) => (
              <Button
                key={b.label}
                small
                label={b.label}
                onPress={b.onPress}
                color={b.primary ? t.accent : b.danger ? t.bad : 'rgba(0,0,0,0.07)'}
                textColor={b.primary || b.danger ? '#fff' : t.ink}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Bottom action sheet. items: [{label, onPress, danger}]
export function Sheet({ visible, title, onClose, items, bottomInset = 0 }) {
  const t = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: t.overlay, justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: t.cream,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 10 + bottomInset,
            paddingTop: 8,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.15)',
            }}
          />
          <Text style={{ fontFamily: FONT.display, fontSize: 20, color: t.ink, padding: 16, paddingBottom: 6 }}>
            {title}
          </Text>
          {items.map((it) => (
            <Pressable
              key={it.label}
              onPressIn={tap}
              onPress={it.onPress}
              style={({ pressed }) => ({
                paddingVertical: 14,
                paddingHorizontal: 20,
                backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent',
              })}
            >
              <Text
                style={{
                  fontFamily: FONT.bold,
                  fontSize: 16,
                  color: it.danger ? t.bad : t.ink,
                }}
              >
                {it.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Small self-dismissing toast. Show by changing `message` ({text, key}).
export function Toast({ message, bottom = 100 }) {
  const a = useRef(new Animated.Value(0)).current;
  const [text, setText] = useState('');
  useEffect(() => {
    if (!message) return;
    setText(message.text);
    a.setValue(0);
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(a, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [message]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 24,
        right: 24,
        bottom,
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        backgroundColor: '#1B2B3A',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ color: '#fff', fontFamily: FONT.bold, textAlign: 'center' }}>{text}</Text>
    </Animated.View>
  );
}

// Small -/+ stepper.
export function Stepper({ value, onMinus, onPlus }) {
  const t = useTheme();
  const btn = (g, fn) => (
    <Pressable
      onPressIn={tap}
      onPress={fn}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: pressed ? t.accentShade : t.accent,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text style={{ color: '#fff', fontSize: 22, fontFamily: FONT.display, marginTop: -2 }}>{g}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {btn('−', onMinus)}
      <Text
        style={{
          minWidth: 44,
          textAlign: 'center',
          fontFamily: FONT.display,
          fontSize: 26,
          color: t.ink,
        }}
      >
        {value}
      </Text>
      {btn('+', onPlus)}
    </View>
  );
}

export const s = StyleSheet.create({});
