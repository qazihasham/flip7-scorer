import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardsFor, FLIP7, CardChip } from './cards';
import { emptyRound, computeTotal, roundIsEmpty } from './scoring';
import { useStore } from './store';
import { useTheme, FONT } from './theme';
import { Button } from './components/ui';

const RED = '#E94F37';
const CREAM = '#FFF6E3';

export default function ScoringModal({
  visible,
  playerName,
  playerScore = 0,
  bottomInset = 0,
  onCancel,
  onAdd,
}) {
  const [round, setRound] = useState(emptyRound());
  const [customText, setCustomText] = useState('');
  const t = useTheme();
  const { state } = useStore();
  // Only the cards that exist in the selected edition.
  const deck = cardsFor(state.edition);
  const insets = useSafeAreaInsets();
  // Inside a RN Modal, useSafeAreaInsets() reports 0 (separate native root),
  // so trust the value passed from App, falling back to any local reading.
  const safeBottom = Math.max(bottomInset, insets.bottom);
  // Percentage maxHeight is unreliable through nested flex; use a concrete px
  // cap so the panel is always bounded and the ScrollView actually scrolls.
  const { height: winH } = useWindowDimensions();
  const panelMaxHeight = winH * 0.9;

  useEffect(() => {
    if (visible) {
      setRound(emptyRound());
      setCustomText('');
    }
  }, [visible]);

  // Flip 7 rule: selecting 7 number cards auto-selects the Flip 7 (+15) bonus;
  // dropping below 7 auto-deselects it.
  useEffect(() => {
    setRound((r) => {
      const shouldFlip7 = r.numbers.length >= 7;
      return r.flip7 === shouldFlip7 ? r : { ...r, flip7: shouldFlip7 };
    });
  }, [round.numbers.length]);

  const tot = computeTotal(round);
  const total = tot;
  const finalScore = playerScore + total;

  // Tap a number card to select it; tap again to deselect (no duplicate copy).
  const toggleNumber = (card) =>
    setRound((r) => {
      const on = r.numbers.some((n) => n.key === card.key);
      return {
        ...r,
        numbers: on
          ? r.numbers.filter((n) => n.key !== card.key)
          : [...r.numbers, { key: card.key, value: card.value }],
      };
    });
  const isNumberOn = (card) => round.numbers.some((n) => n.key === card.key);
  // Modifiers behave like number cards: tap to select, tap again to deselect.
  const toggleMod = (card) =>
    setRound((r) => {
      const on = r.modifiers.some((m) => m.key === card.key);
      return {
        ...r,
        modifiers: on
          ? r.modifiers.filter((m) => m.key !== card.key)
          : [...r.modifiers, { key: card.key, value: card.value }],
      };
    });
  const isModOn = (card) => round.modifiers.some((m) => m.key === card.key);
  const toggle = (field) => setRound((r) => ({ ...r, [field]: !r[field] }));

  const onCustomChange = (t) => {
    let s = t.replace(/[^0-9-]/g, '');
    s = s.replace(/(?!^)-/g, ''); // keep only a leading minus
    setCustomText(s);
    const n = parseInt(s, 10);
    setRound((r) => ({ ...r, custom: isNaN(n) ? 0 : n }));
  };

  // Guarantees you can enter negatives even on Android keyboards without a minus.
  const toggleSign = () => {
    setCustomText((t) => (t.startsWith('-') ? t.slice(1) : t ? '-' + t : '-'));
    setRound((r) => ({ ...r, custom: -(r.custom || 0) }));
  };

  const breakdown = () => {
    const parts = ['\u03A3' + round.numbers.reduce((a, n) => a + n.value, 0)];
    if (round.multiplyX2) parts.push('×2');
    if (round.divideBy2) parts.push('÷2');
    const ms = round.modifiers.reduce((a, m) => a + m.value, 0);
    if (ms !== 0) parts.push(ms >= 0 ? '+' + ms : '' + ms);
    if (round.flip7) parts.push('+15');
    if (round.custom) parts.push(round.custom >= 0 ? '+' + round.custom : '' + round.custom);
    return parts.join('   ');
  };

  const disabled = roundIsEmpty(round);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <View style={[styles.panel, { maxHeight: panelMaxHeight }]}>
            <View style={[styles.head, { backgroundColor: t.bgBottom }]}>
              <Pressable style={styles.close} onPress={onCancel} hitSlop={10}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
              <Text style={styles.headSub}>Add to {playerName}</Text>
              <Text style={[styles.headTotal, { color: t.yellow }]}>{total >= 0 ? '+' + total : total}</Text>
              <Text style={styles.headBreak}>{breakdown()}</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewText}>
                  {playerScore} + {total >= 0 ? total : `(${total})`} ={' '}
                  <Text style={styles.previewFinal}>{finalScore}</Text>
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              <Section title="Number cards" />
              <View style={styles.wrap}>
                {deck.numbers.map((c) => (
                  <CardChip
                    key={c.key}
                    card={c}
                    selected={isNumberOn(c)}
                    onPress={() => toggleNumber(c)}
                  />
                ))}
              </View>
              <Selected
                labels={deck.numbers.filter(isNumberOn).map((c) => oneLine(c.label))}
              />

              <Section title={deck.multiplierField === 'divideBy2' ? 'Divide' : 'Multiply'} />
              <View style={styles.row}>
                <CardChip
                  card={deck.multiplier}
                  selected={round[deck.multiplierField]}
                  onPress={() => toggle(deck.multiplierField)}
                />
              </View>
              <Selected labels={round[deck.multiplierField] ? [deck.multiplier.label] : []} />

              <Section title="Modifiers" />
              <View style={styles.wrap}>
                {deck.mods.map((c) => (
                  <CardChip key={c.key} card={c} selected={isModOn(c)} onPress={() => toggleMod(c)} />
                ))}
              </View>
              <Selected labels={deck.mods.filter(isModOn).map((c) => c.label)} />

              <Section title="Flip 7 bonus" />
              <CardChip
                card={FLIP7}
                width={80}
                selected={round.flip7}
                onPress={() => toggle('flip7')}
              />
              <Selected labels={round.flip7 ? ['Flip 7 (+15)'] : []} />

              <Section title="Custom (can be negative)" />
              <View style={styles.row}>
                <TextInput
                  value={customText}
                  onChangeText={onCustomChange}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                  placeholder="e.g. 12"
                  style={styles.input}
                />
                <Pressable style={styles.signBtn} onPress={toggleSign}>
                  <Text style={styles.signText}>±</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: 12 + safeBottom }]}>
              <Pressable
                style={styles.clearBtn}
                onPress={() => {
                  setRound(emptyRound());
                  setCustomText('');
                }}
              >
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
              <Button
                style={{ flex: 1 }}
                disabled={disabled}
                onPress={() => onAdd(total)}
                label={`Add ${total >= 0 ? '+' + total : total} to ${playerName}`}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Section({ title }) {
  return <Text style={styles.section}>{title}</Text>;
}

// Collapse multi-line card labels (e.g. "Lucky\n13") to a single line for previews.
const oneLine = (s) => s.replace(/\n/g, ' ');

// Small preview under each section listing what's currently selected.
function Selected({ labels }) {
  return (
    <View style={styles.selectedRow}>
      <Text style={styles.selectedLabel}>Selected: </Text>
      <Text style={styles.selectedValue}>
        {labels.length ? labels.join(', ') : 'none'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  kav: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  panel: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  // flexShrink lets the scroll area shrink inside the capped panel so it
  // actually scrolls (head + footer stay fixed) instead of overflowing.
  scroll: { flexGrow: 0, flexShrink: 1 },
  head: { backgroundColor: RED, padding: 14, alignItems: 'center' },
  close: { position: 'absolute', right: 12, top: 10, padding: 4 },
  closeText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headSub: { color: '#fff', fontWeight: '600' },
  headTotal: { color: '#fff', fontSize: 46, fontFamily: FONT.display },
  headBreak: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  previewRow: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  previewFinal: { fontSize: 18, fontWeight: 'bold' },
  section: { fontSize: 16, fontFamily: FONT.display, marginTop: 16, marginBottom: 6, color: '#1B2B3A' },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, alignItems: 'baseline' },
  selectedLabel: { fontSize: 12, fontWeight: '700', color: '#8A6D3B' },
  selectedValue: { fontSize: 12, color: '#555', flexShrink: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  pill: { backgroundColor: '#e0e0e0', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 13 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  signBtn: {
    marginLeft: 8,
    backgroundColor: '#555',
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  footer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 10,
    justifyContent: 'center',
  },
  clearText: { fontWeight: '600' },
  addBtn: { flex: 1, backgroundColor: RED, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
