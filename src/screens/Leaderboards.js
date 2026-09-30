import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, EDITIONS, EDITION_LABEL, SEASON_ORDER, seasonForMonth, seasonId } from '../store';
import { useTheme, FONT, medalColor } from '../theme';
import {
  Overlay,
  Screen,
  Card,
  Button,
  PillItem,
  LIGHT_PILL,
  Segmented,
  Dialog,
  Sheet,
  TextField,
  Stepper,
} from '../components/ui';
import SeasonArt, { SEASONS } from '../components/SeasonArt';
import {
  newId,
  hsPath,
  winsPath,
  seasonEntriesPath,
  insertOp,
  deleteOp,
  patchOp,
  setOp,
} from '../ops';

const TABS = [
  { key: 'all', label: '🏆 All-time' },
  { key: 'season', label: '🌤 Season' },
  { key: 'wins', label: '🏁 Wins' },
];

export default function Leaderboards({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const { state, run, getState } = useStore();
  const ed = state.edition;
  const [tab, setTab] = useState('all');
  const [editor, setEditor] = useState(null); // { id|null, name, value }
  const [seasonPick, setSeasonPick] = useState(false);
  const [resetDlg, setResetDlg] = useState(false);
  const [menu, setMenu] = useState(null); // row menu

  const nowTheme = seasonForMonth();
  const [viewTheme, setViewTheme] = useState(nowTheme);
  // Each time the screen opens, start on the calendar season.
  useEffect(() => {
    if (visible) setViewTheme(seasonForMonth());
  }, [visible]);
  const season = state.seasons[ed].list.find((x) => x.id === seasonId(ed, viewTheme));
  const seasonInfo = SEASONS[season.theme];

  const setEdition = (e) =>
    run('board', `Switched to ${EDITION_LABEL[e]}`, [setOp(['edition'], e, getState())]);

  // ---- data for current tab
  let path, rows, valueKey;
  if (tab === 'all') {
    path = hsPath(ed);
    rows = state.highScores[ed];
    valueKey = 'score';
  } else if (tab === 'season') {
    path = seasonEntriesPath(season.id);
    rows = state.seasonEntries[season.id] || [];
    valueKey = 'score';
  } else {
    path = winsPath(ed);
    rows = state.wins[ed];
    valueKey = 'wins';
  }
  const ranked = [...rows].sort((a, b) => b[valueKey] - a[valueKey]);
  const boardName = tab === 'all' ? 'All-time' : tab === 'season' ? season.name : 'Wins';

  // ---- actions
  const openAdd = () => setEditor({ id: null, name: '', value: '' });
  const openEdit = (e) => setEditor({ id: e.id, name: e.name, value: String(e[valueKey]) });

  const saveEditor = () => {
    const name = editor.name.trim();
    if (!name) return;
    const n = parseInt(editor.value, 10);
    const v = isNaN(n) ? 0 : n;
    const s = getState();
    if (editor.id == null) {
      run('board', `${boardName}: added ${name} (${v})`, [
        insertOp(path, { id: newId(), name, [valueKey]: v }, s),
      ]);
    } else {
      const old = rows.find((r) => r.id === editor.id);
      const changes = {};
      if (old.name !== name) changes.name = name;
      if (old[valueKey] !== v) changes[valueKey] = v;
      if (Object.keys(changes).length) {
        const what = [
          changes.name ? `renamed ${old.name} → ${name}` : null,
          changes[valueKey] !== undefined ? `${name} ${old[valueKey]} → ${v}` : null,
        ]
          .filter(Boolean)
          .join(', ');
        run('board', `${boardName}: ${what}`, [patchOp(path, old.id, changes, s)]);
      }
    }
    setEditor(null);
  };

  const removeRow = (e) => {
    run('board', `${boardName}: deleted ${e.name} (${e[valueKey]})`, [
      deleteOp(path, e.id, getState()),
    ]);
    setMenu(null);
  };

  const step = (e, by) => {
    if (e.wins + by < 0) return;
    run('board', `Wins: ${e.name} ${e.wins} → ${e.wins + by}`, [
      { t: 'inc', path, id: e.id, field: 'wins', by },
    ]);
  };

  // Browsing only: sync always writes to the calendar season.
  const pickSeason = (theme) => {
    setViewTheme(theme);
    setSeasonPick(false);
  };

  // Clears only this season's board. Other seasons keep their scores.
  const resetSeason = () => {
    const s = getState();
    const list = s.seasonEntries[season.id] || [];
    if (list.length)
      run(
        'board',
        `Reset ${season.name} scores (${list.length} ${list.length === 1 ? 'entry' : 'entries'} cleared)`,
        list.map((e) => deleteOp(seasonEntriesPath(season.id), e.id, s))
      );
    setResetDlg(false);
  };

  const medal = (i) => {
    const c = medalColor(i);
    return (
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: c || 'rgba(0,0,0,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Text style={{ fontFamily: FONT.display, fontSize: 17, color: c ? '#3A2A00' : t.inkSoft }}>
          {i + 1}
        </Text>
      </View>
    );
  };

  const header =
    tab === 'season' ? (
      <View>
        <View style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 10 }}>
          <SeasonArt theme={season.theme} height={120} />
        </View>

        {/* season dropdown */}
        <Pressable
          onPress={() => setSeasonPick(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: t.cream,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 11,
          }}
        >
          <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: t.ink }}>
            {seasonInfo.emoji} {season.name}
            <Text style={{ color: t.inkSoft, fontFamily: FONT.body }}>  {seasonInfo.months}</Text>
          </Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: t.inkSoft }}>▾</Text>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            marginBottom: 12,
            minHeight: 36,
          }}
        >
          {season.theme !== nowTheme ? (
            <Button
              small
              icon={SEASONS[nowTheme].emoji}
              label={`Switch to ${SEASONS[nowTheme].label}`}
              color="rgba(255,255,255,0.22)"
              onPress={() => pickSeason(nowTheme)}
            />
          ) : (
            <View />
          )}
          {rows.length > 0 && (
            <Button small label="Reset" color="rgba(0,0,0,0.22)" onPress={() => setResetDlg(true)} />
          )}
        </View>
      </View>
    ) : null;

  return (
    <Overlay visible={visible} onClose={onClose}>
      <Screen>
        <View style={{ paddingTop: insets.top }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
            <PillItem icon="⬅️" height={36} bg={LIGHT_PILL} onPress={onClose} />
            <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: 26, color: t.yellow }}>
              Leaderboards
            </Text>
            <Button small label="＋ Add" color={t.yellow} textColor={t.shade} onPress={openAdd} />
          </View>
          <View style={{ paddingHorizontal: 12, gap: 8, paddingBottom: 10 }}>
            <Segmented
              value={ed}
              onChange={setEdition}
              options={EDITIONS.map((e) => ({ key: e, label: EDITION_LABEL[e] }))}
            />
            <Segmented value={tab} onChange={setTab} options={TABS} />
          </View>
        </View>

        <FlatList
          data={ranked}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 + insets.bottom }}
          ListEmptyComponent={
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 30, fontFamily: FONT.bold }}>
              No scores yet
            </Text>
          }
          renderItem={({ item, index }) => (
            <Card
              glow={index === 0 && item[valueKey] > 0}
              onPress={() => (tab === 'wins' ? setMenu(item) : openEdit(item))}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              {medal(index)}
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.bold, fontSize: 18, color: t.ink }}>
                {item.name}
              </Text>
              {tab === 'wins' ? (
                <Stepper value={item.wins} onMinus={() => step(item, -1)} onPlus={() => step(item, 1)} />
              ) : (
                <Text style={{ fontFamily: FONT.display, fontSize: 28, color: t.ink, marginHorizontal: 8 }}>
                  {item[valueKey]}
                </Text>
              )}
              {tab !== 'wins' && (
                <Pressable onPress={() => setMenu(item)} hitSlop={8} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 18 }}>🗑</Text>
                </Pressable>
              )}
            </Card>
          )}
        />

        {/* add / edit */}
        <Dialog
          visible={!!editor}
          onClose={() => setEditor(null)}
          title={editor && editor.id != null ? 'Edit entry' : 'Add entry'}
          buttons={[
            { label: 'Cancel', onPress: () => setEditor(null) },
            { label: 'Save', primary: true, onPress: saveEditor },
          ]}
        >
          <TextField
            label="Name"
            value={editor ? editor.name : ''}
            onChangeText={(v) => setEditor((e) => ({ ...e, name: v }))}
            autoFocus
            placeholder="Player name"
          />
          <TextField
            label={tab === 'wins' ? 'Wins' : 'Score'}
            value={editor ? editor.value : ''}
            onChangeText={(v) => setEditor((e) => ({ ...e, value: v.replace(/[^0-9]/g, '') }))}
            keyboardType="number-pad"
            placeholder="0"
          />
        </Dialog>

        {/* row menu */}
        <Sheet
          visible={!!menu}
          title={menu ? menu.name : ''}
          bottomInset={insets.bottom}
          onClose={() => setMenu(null)}
          items={[
            ...(tab === 'wins'
              ? [
                  {
                    label: 'Rename / set wins',
                    onPress: () => {
                      const m = menu;
                      setMenu(null);
                      openEdit(m);
                    },
                  },
                ]
              : []),
            { label: `Delete ${menu ? menu.name : ''}`, danger: true, onPress: () => removeRow(menu) },
            { label: 'Cancel', onPress: () => setMenu(null) },
          ]}
        />

        {/* season dropdown list */}
        <Sheet
          visible={seasonPick}
          title="Seasons"
          bottomInset={insets.bottom}
          onClose={() => setSeasonPick(false)}
          items={SEASON_ORDER.map((th) => ({
            label: `${SEASONS[th].emoji}  ${SEASONS[th].label}  ·  ${SEASONS[th].months}${
              th === season.theme ? '  ✓' : ''
            }`,
            onPress: () => pickSeason(th),
          }))}
        />

        {/* reset this season */}
        <Dialog
          visible={resetDlg}
          onClose={() => setResetDlg(false)}
          title={`Reset ${season.name}?`}
          buttons={[
            { label: 'Cancel', onPress: () => setResetDlg(false) },
            { label: 'Reset', danger: true, onPress: resetSeason },
          ]}
        >
          <Text style={{ fontFamily: FONT.body, color: t.inkSoft, marginTop: 8, fontSize: 15 }}>
            Clears this season's scores. Undo anytime from History.
          </Text>
        </Dialog>
      </Screen>
    </Overlay>
  );
}
