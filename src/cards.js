import React from 'react';
import { Pressable, Text, Image, StyleSheet } from 'react-native';

// Set to true AFTER you add PNGs to assets/cards/ and uncomment the matching
// lines in CARD_IMAGES below.
export const USE_CARD_IMAGES = false;

// React Native's bundler (Metro) needs STATIC require() paths — you cannot
// build the path from a variable. So every image is listed explicitly here.
// Uncomment each line as you add the file. Any card not listed just shows the
// coloured placeholder, so you can add art one card at a time.
const CARD_IMAGES = {
  // num_0:  require('../assets/cards/num_0.png'),
  // num_1:  require('../assets/cards/num_1.png'),
  // num_2:  require('../assets/cards/num_2.png'),
  // num_3:  require('../assets/cards/num_3.png'),
  // num_4:  require('../assets/cards/num_4.png'),
  // num_5:  require('../assets/cards/num_5.png'),
  // num_6:  require('../assets/cards/num_6.png'),
  // num_7:  require('../assets/cards/num_7.png'),
  // num_8:  require('../assets/cards/num_8.png'),
  // num_9:  require('../assets/cards/num_9.png'),
  // num_10: require('../assets/cards/num_10.png'),
  // num_11: require('../assets/cards/num_11.png'),
  // num_12: require('../assets/cards/num_12.png'),
  // num_13: require('../assets/cards/num_13.png'),
  // mult_x2:   require('../assets/cards/mult_x2.png'),
  // mult_div2: require('../assets/cards/mult_div2.png'),
  // mod_p2:  require('../assets/cards/mod_p2.png'),
  // mod_p4:  require('../assets/cards/mod_p4.png'),
  // mod_p6:  require('../assets/cards/mod_p6.png'),
  // mod_p8:  require('../assets/cards/mod_p8.png'),
  // mod_p10: require('../assets/cards/mod_p10.png'),
  // mod_m2:  require('../assets/cards/mod_m2.png'),
  // mod_m4:  require('../assets/cards/mod_m4.png'),
  // mod_m6:  require('../assets/cards/mod_m6.png'),
  // mod_m8:  require('../assets/cards/mod_m8.png'),
  // mod_m10: require('../assets/cards/mod_m10.png'),
  // bonus_flip7: require('../assets/cards/bonus_flip7.png'),
};

// ---- card catalog (covers Flip 7 AND Flip 7 With a Vengeance) --------------

export const NUMBER_CARDS = [
  { label: '0', kind: 'number', value: 0, key: 'num_0', color: '#9E9E9E' },
  { label: '1', kind: 'number', value: 1, key: 'num_1', color: '#7E57C2' },
  { label: '2', kind: 'number', value: 2, key: 'num_2', color: '#EC407A' },
  { label: '3', kind: 'number', value: 3, key: 'num_3', color: '#EF5350' },
  { label: '4', kind: 'number', value: 4, key: 'num_4', color: '#29B6F6' },
  { label: '5', kind: 'number', value: 5, key: 'num_5', color: '#66BB6A' },
  { label: '6', kind: 'number', value: 6, key: 'num_6', color: '#AB47BC' },
  { label: '7', kind: 'number', value: 7, key: 'num_7', color: '#FFA726' },
  { label: '8', kind: 'number', value: 8, key: 'num_8', color: '#26A69A' },
  { label: '9', kind: 'number', value: 9, key: 'num_9', color: '#FF7043' },
  { label: '10', kind: 'number', value: 10, key: 'num_10', color: '#D32F2F' },
  { label: '11', kind: 'number', value: 11, key: 'num_11', color: '#42A5F5' },
  { label: '12', kind: 'number', value: 12, key: 'num_12', color: '#78909C' },
  { label: '13', kind: 'number', value: 13, key: 'num_13', color: '#5C6BC0' },
  { label: 'Lucky\n13', kind: 'number', value: 13, key: 'num_lucky13', color: '#00897B' },
];

export const MULTIPLIERS = [
  { label: '×2', kind: 'multiply', value: 2, key: 'mult_x2', color: '#F9A825' },
  { label: '÷2', kind: 'divide', value: 2, key: 'mult_div2', color: '#E64A19' },
];

export const PLUS_MODS = [
  { label: '+2', kind: 'modifier', value: 2, key: 'mod_p2', color: '#2E7D32' },
  { label: '+4', kind: 'modifier', value: 4, key: 'mod_p4', color: '#2E7D32' },
  { label: '+6', kind: 'modifier', value: 6, key: 'mod_p6', color: '#2E7D32' },
  { label: '+8', kind: 'modifier', value: 8, key: 'mod_p8', color: '#2E7D32' },
  { label: '+10', kind: 'modifier', value: 10, key: 'mod_p10', color: '#2E7D32' },
];

export const MINUS_MODS = [
  { label: '−2', kind: 'modifier', value: -2, key: 'mod_m2', color: '#C62828' },
  { label: '−4', kind: 'modifier', value: -4, key: 'mod_m4', color: '#C62828' },
  { label: '−6', kind: 'modifier', value: -6, key: 'mod_m6', color: '#C62828' },
  { label: '−8', kind: 'modifier', value: -8, key: 'mod_m8', color: '#C62828' },
  { label: '−10', kind: 'modifier', value: -10, key: 'mod_m10', color: '#C62828' },
];

export const FLIP7 = {
  label: 'FLIP 7\n+15',
  kind: 'bonus',
  value: 15,
  key: 'bonus_flip7',
  color: '#1565C0',
};

// A tappable mini-card: coloured placeholder now, your PNG once you enable it.
export function CardChip({ card, onPress, selected, width = 50, height = 70 }) {
  const img = USE_CARD_IMAGES ? CARD_IMAGES[card.key] : null;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: card.color,
          width,
          height,
          borderColor: selected ? '#ffffff' : 'rgba(0,0,0,0.25)',
          borderWidth: selected ? 3 : 1.5,
        },
        selected && styles.chipSelected,
      ]}
    >
      {img ? (
        <Image source={img} style={styles.img} resizeMode="cover" />
      ) : (
        <Text style={styles.chipText}>{card.label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Selected cards pop a teensy bit: slight scale + lift.
  chipSelected: {
    transform: [{ scale: 1.06 }],
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  img: { width: '100%', height: '100%' },
  chipText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
});
