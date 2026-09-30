import React, { useMemo, useState } from 'react';
import { View, Text, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useTheme, FONT } from '../theme';
import { Overlay, Screen, Card, Button, PillItem, LIGHT_PILL, Segmented, Dialog, Toast } from '../components/ui';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'game', label: 'Game' },
  { key: 'board', label: 'Boards' },
  { key: 'sync', label: 'Sync' },
];
const ICON = { game: '🎴', board: '🏆', sync: '🔄' };

const dayLabel = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
const timeLabel = (ts) =>
  new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function History({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const { state, toggleEntry, clearHistory } = useStore();
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const sections = useMemo(() => {
    const items = state.history.filter((h) => filter === 'all' || h.screen === filter);
    const map = [];
    items.forEach((h) => {
      const k = dayLabel(h.ts);
      let sec = map.find((s) => s.title === k);
      if (!sec) map.push((sec = { title: k, data: [] }));
      sec.data.push(h);
    });
    return map;
  }, [state.history, filter]);

  const onToggle = (h) => {
    const r = toggleEntry(h.id);
    setToast({ text: r.msg, key: Date.now() });
  };

  return (
    <Overlay visible={visible} onClose={onClose}>
      <Screen>
        <View style={{ paddingTop: insets.top }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
            <PillItem icon="⬅️" height={36} bg={LIGHT_PILL} onPress={onClose} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 26, color: t.yellow }}>History</Text>
              <Text style={{ fontFamily: FONT.body, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: -2 }}>
                Clears after 24 hours
              </Text>
            </View>
            {state.history.length > 0 && (
              <PillItem
                icon="🗑️"
                label="Clear"
                height={36}
                bg={LIGHT_PILL}
                onPress={() => setConfirmClear(true)}
              />
            )}
          </View>
          <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
            <Segmented value={filter} onChange={setFilter} options={FILTERS} />
          </View>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(h) => h.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 + insets.bottom }}
          ListEmptyComponent={
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 30, fontFamily: FONT.bold }}>
              No activity yet
            </Text>
          }
          renderSectionHeader={({ section }) => (
            <Text style={{ color: '#fff', fontFamily: FONT.display, fontSize: 16, marginTop: 8, marginBottom: 6 }}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <Card style={{ flexDirection: 'row', alignItems: 'center', opacity: item.undone ? 0.6 : 1 }}>
              <Text style={{ fontSize: 22, marginRight: 10 }}>{ICON[item.screen] || '•'}</Text>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                  style={{
                    fontFamily: FONT.bold,
                    fontSize: 15,
                    color: t.ink,
                    textDecorationLine: item.undone ? 'line-through' : 'none',
                  }}
                >
                  {item.label}
                </Text>
                <Text style={{ fontFamily: FONT.body, fontSize: 12, color: t.inkSoft }}>
                  {timeLabel(item.ts)}
                </Text>
              </View>
              <Button
                small
                label={item.undone ? 'Redo' : 'Undo'}
                color={item.undone ? t.good : t.accent}
                onPress={() => onToggle(item)}
              />
            </Card>
          )}
        />

        <Dialog
          visible={confirmClear}
          onClose={() => setConfirmClear(false)}
          title="Clear history?"
          buttons={[
            { label: 'Cancel', onPress: () => setConfirmClear(false) },
            {
              label: 'Clear',
              danger: true,
              onPress: () => {
                clearHistory();
                setConfirmClear(false);
              },
            },
          ]}
        >
          <Text style={{ fontFamily: FONT.body, color: t.inkSoft, marginTop: 6 }}>
            Scores stay. Past changes can't be undone.
          </Text>
        </Dialog>
        <Toast message={toast} bottom={30 + insets.bottom} />
      </Screen>
    </Overlay>
  );
}
