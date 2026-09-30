import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, FlatList, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Import each weight by path so only these 3 font files are bundled (not all 18 Nunito weights).
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { StoreProvider, useStore, EDITIONS, EDITION_LABEL } from './src/store';
import { useTheme, FONT, medalColor } from './src/theme';
import ScoringModal from './src/ScoringModal';
import Leaderboards from './src/screens/Leaderboards';
import History from './src/screens/History';
import Confetti from './src/components/Confetti';
import {
  Screen,
  Card,
  Button,
  PillItem,
  LIGHT_PILL,
  Segmented,
  Dialog,
  Sheet,
  TextField,
  Toast,
  tap,
  success,
} from './src/components/ui';
import { P, newId, insertOp, deleteOp, patchOp, setOp } from './src/ops';
import { buildSync, topScoreOf, WIN } from './src/sync';

export default function App() {
  const [fontsLoaded] = useFonts({ LilitaOne_400Regular, Nunito_600SemiBold, Nunito_800ExtraBold });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AppInner />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const { state, run, getState, loaded } = useStore();
  const { players, edition } = state;

  const [scoringId, setScoringId] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [nameModal, setNameModal] = useState(null); // { mode, id, value }
  const [sortMode, setSortMode] = useState('score');
  const [showBoards, setShowBoards] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirm, setConfirm] = useState(null); // { title, body, label, danger, onOk }
  const [syncResult, setSyncResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(0);

  const say = (text) => setToast({ text, key: Date.now() });
  const closeBoards = useCallback(() => setShowBoards(false), []);
  const closeHistory = useCallback(() => setShowHistory(false), []);

  const topScore = topScoreOf(players);
  const hasWinner = topScore >= WIN;
  const winnerNames = players
    .filter((p) => p.score === topScore)
    .map((p) => p.name)
    .join(' & ');

  // Confetti when the top score crosses 200 during play (not on load / undo).
  const prevTop = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    const prev = prevTop.current;
    prevTop.current = topScore;
    if (prev === null) return;
    const last = state.history[0];
    if (prev < WIN && topScore >= WIN && last && last.screen === 'game' && !last.undone) {
      setBurst(Date.now());
      success();
    }
  }, [topScore, loaded]);

  const scoringPlayer = players.find((p) => p.id === scoringId) || null;
  const menuPlayer = players.find((p) => p.id === menuId) || null;

  const displayPlayers = useMemo(() => {
    const list = [...players];
    if (sortMode === 'alpha') list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => b.score - a.score);
    return list;
  }, [players, sortMode]);

  // ---- game actions (each one is a reversible history entry)
  const addPlayer = (name) =>
    run('game', `Added player ${name}`, [
      insertOp(P, { id: newId(), name, score: 0, history: [] }, getState()),
    ]);
  const renamePlayer = (id, name) => {
    const p = players.find((x) => x.id === id);
    if (p && p.name !== name)
      run('game', `Renamed ${p.name} → ${name}`, [patchOp(P, id, { name }, getState())]);
  };
  const removePlayer = (p) =>
    run('game', `Removed ${p.name} (${p.score})`, [deleteOp(P, p.id, getState())]);
  const resetScore = (p) =>
    run('game', `Reset ${p.name}'s score (${p.score} → 0)`, [
      patchOp(P, p.id, { score: 0, history: [] }, getState()),
    ]);
  const resetAll = () => {
    const s = getState();
    run('game', 'New game (all scores reset)', [
      ...s.players.map((p) => patchOp(P, p.id, { score: 0, history: [] }, s)),
      setOp(['gameSyncedAt'], null, s),
    ]);
  };
  const applyAdd = (p, amt) =>
    run('game', `${p.name} ${amt >= 0 ? '+' : ''}${amt} (${p.score} → ${p.score + amt})`, [
      { t: 'score', path: P, id: p.id, amt, rev: false },
    ]);
  const undoLast = (p) => {
    const last = p.history[p.history.length - 1];
    run('game', `Undid ${p.name}'s last add (${last >= 0 ? '+' : ''}${last})`, [
      { t: 'score', path: P, id: p.id, amt: last, rev: true },
    ]);
  };

  const doSync = () => {
    const r = buildSync(getState());
    if (r.error) return say(r.error);
    run('sync', r.label, r.ops);
    success();
    setSyncResult(r);
  };
  const onSyncPress = () => {
    if (!hasWinner) return say(`No one's at ${WIN} yet`);
    if (state.gameSyncedAt)
      return setConfirm({
        title: 'Sync again?',
        body: 'This game is already synced. Wins will count twice.',
        label: 'Sync again',
        onOk: doSync,
      });
    doSync();
  };

  const ask = (c) => setConfirm(c);
  const openName = (mode, p) =>
    setNameModal({ mode, id: p ? p.id : null, value: p ? p.name : '' });

  return (
    <View style={{ flex: 1 }}>
    <Screen style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ alignItems: 'center', paddingTop: 6 }}>
        <Image
          source={require('./assets/flip7-header-logo.png')}
          style={{ height: 52, width: 170 }}
          resizeMode="contain"
        />
      </View>
      <View style={{ paddingHorizontal: 12, paddingTop: 6 }}>
        <Segmented
          value={edition}
          onChange={(e) =>
            e !== edition && run('board', `Switched to ${EDITION_LABEL[e]}`, [setOp(['edition'], e, getState())])
          }
          options={EDITIONS.map((e) => ({ key: e, label: EDITION_LABEL[e] }))}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PillItem
            icon={sortMode === 'score' ? '🔢' : '🔤'}
            height={36}
            bg={LIGHT_PILL}
            onPress={() => {
              const next = sortMode === 'score' ? 'alpha' : 'score';
              setSortMode(next);
              say(next === 'score' ? 'Sorted by score' : 'Sorted A–Z');
            }}
          />
          <PillItem
            icon="🆕"
            height={36}
            bg={LIGHT_PILL}
            onPress={() =>
              players.length &&
              ask({
                title: 'New game?',
                body: 'All scores go back to 0. Players stay.',
                label: 'New game',
                danger: true,
                onOk: resetAll,
              })
            }
          />
        </View>
        <Button
          small
          label="＋ Add player"
          color={t.yellow}
          textColor={t.shade}
          onPress={() => openName('add')}
        />
      </View>

      {hasWinner && (
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 2,
            backgroundColor: t.yellow,
            borderRadius: 14,
            paddingVertical: 8,
            paddingHorizontal: 12,
          }}
        >
          <Text numberOfLines={1} style={{ textAlign: 'center', fontFamily: FONT.display, fontSize: 16, color: t.shade }}>
            🏆 {winnerNames} wins! Tap Sync to save.
          </Text>
        </View>
      )}

      {players.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 26, color: '#fff' }}>No players yet</Text>
        </View>
      ) : (
        <FlatList
          data={displayPlayers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 130 + insets.bottom }}
          renderItem={({ item, index }) => {
            const last = item.history.length ? item.history[item.history.length - 1] : null;
            const isLeader = item.score === topScore && item.score > 0;
            const showRank = sortMode === 'score';
            const mc = medalColor(index);
            return (
              <Card glow={isLeader} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {showRank && (
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      marginRight: 10,
                      backgroundColor: mc || 'rgba(0,0,0,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONT.display, fontSize: 17, color: mc ? '#3A2A00' : t.inkSoft }}>
                      {index + 1}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 18, color: t.ink }}>
                    {isLeader ? '👑 ' : ''}
                    {item.name}
                  </Text>
                  <Text style={{ fontFamily: FONT.display, fontSize: 40, color: t.ink, lineHeight: 46 }}>
                    {item.score}
                  </Text>
                  {last !== null && (
                    <Text style={{ fontFamily: FONT.body, fontSize: 12, color: t.inkSoft }}>
                      last: {last >= 0 ? '+' + last : last}
                    </Text>
                  )}
                </View>
                <Button small label="+ Score" onPress={() => setScoringId(item.id)} />
                <Pressable onPress={() => setMenuId(item.id)} hitSlop={8} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 24, color: t.inkSoft, fontFamily: FONT.display }}>⋯</Text>
                </Pressable>
              </Card>
            );
          }}
        />
      )}

      {/* Bottom dock: one slim bar */}
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12 + insets.bottom,
          height: 52,
          borderRadius: 26,
          backgroundColor: t.shade,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          gap: 6,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <PillItem
          icon="🕘"
          label="History"
          bg="rgba(255,255,255,0.14)"
          style={{ flex: 1 }}
          onPress={() => setShowHistory(true)}
        />
        <PillItem
          icon="🏆"
          label="Boards"
          bg="rgba(255,255,255,0.14)"
          style={{ flex: 1 }}
          onPress={() => setShowBoards(true)}
        />
        <Button
          small
          icon="🔄"
          label="Sync"
          color={hasWinner ? t.yellow : 'rgba(255,255,255,0.14)'}
          textColor={hasWinner ? t.shade : '#fff'}
          style={{ height: 40, flex: 1 }}
          onPress={onSyncPress}
        />
      </View>

      <Toast message={toast} bottom={100 + insets.bottom} />


      <ScoringModal
        visible={!!scoringPlayer}
        playerName={scoringPlayer ? scoringPlayer.name : ''}
        playerScore={scoringPlayer ? scoringPlayer.score : 0}
        bottomInset={insets.bottom}
        onCancel={() => setScoringId(null)}
        onAdd={(total) => {
          applyAdd(scoringPlayer, total);
          setScoringId(null);
        }}
      />

      <Sheet
        visible={!!menuPlayer}
        title={menuPlayer ? menuPlayer.name : ''}
        bottomInset={insets.bottom}
        onClose={() => setMenuId(null)}
        items={[
          ...(menuPlayer && menuPlayer.history.length > 0
            ? [{ label: 'Undo last add', onPress: () => { undoLast(menuPlayer); setMenuId(null); } }]
            : []),
          { label: 'Rename', onPress: () => { const p = menuPlayer; setMenuId(null); openName('rename', p); } },
          { label: 'Reset score', onPress: () => { resetScore(menuPlayer); setMenuId(null); } },
          {
            label: 'Remove player',
            danger: true,
            onPress: () => {
              const p = menuPlayer;
              setMenuId(null);
              ask({
                title: `Remove ${p.name}?`,
                body: 'Their score goes too.',
                label: 'Remove',
                danger: true,
                onOk: () => removePlayer(p),
              });
            },
          },
          { label: 'Cancel', onPress: () => setMenuId(null) },
        ]}
      />

      <NameModal
        state={nameModal}
        onCancel={() => setNameModal(null)}
        onSubmit={(name) => {
          const n = name.trim();
          if (n) {
            if (nameModal.mode === 'add') addPlayer(n);
            else renamePlayer(nameModal.id, n);
          }
          setNameModal(null);
        }}
      />

      <Dialog
        visible={!!confirm}
        title={confirm ? confirm.title : ''}
        onClose={() => setConfirm(null)}
        buttons={[
          { label: 'Cancel', onPress: () => setConfirm(null) },
          {
            label: confirm ? confirm.label : 'OK',
            danger: confirm && confirm.danger,
            primary: confirm && !confirm.danger,
            onPress: () => {
              const c = confirm;
              setConfirm(null);
              c.onOk();
            },
          },
        ]}
      >
        <Text style={{ fontFamily: FONT.body, color: t.inkSoft, marginTop: 8, fontSize: 15 }}>
          {confirm ? confirm.body : ''}
        </Text>
      </Dialog>

      <Dialog
        visible={!!syncResult}
        title="Synced! 🎉"
        onClose={() => setSyncResult(null)}
        buttons={[
          { label: 'Done', primary: true, onPress: () => setSyncResult(null) },
        ]}
      >
        {syncResult &&
          syncResult.lines.map((l) => (
            <View key={l.name} style={{ marginTop: 10 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: t.ink }}>
                {l.name} · {l.score}
              </Text>
              {l.parts.map((p) => (
                <Text key={p} style={{ fontFamily: FONT.body, color: t.inkSoft, marginTop: 2 }}>
                  • {p}
                </Text>
              ))}
            </View>
          ))}
      </Dialog>
    </Screen>

      {/* Full-screen pages slide in over the main screen (same window, no Modal) */}
      <Leaderboards visible={showBoards} onClose={closeBoards} />
      <History visible={showHistory} onClose={closeHistory} />
      <Confetti burstKey={burst} />
    </View>
  );
}

function NameModal({ state, onCancel, onSubmit }) {
  const [text, setText] = useState('');
  useEffect(() => {
    setText(state ? state.value || '' : '');
  }, [state]);
  return (
    <Dialog
      visible={!!state}
      onClose={onCancel}
      title={state && state.mode === 'rename' ? 'Rename player' : 'Add player'}
      buttons={[
        { label: 'Cancel', onPress: onCancel },
        { label: 'OK', primary: true, onPress: () => onSubmit(text) },
      ]}
    >
      <TextField
        value={text}
        onChangeText={setText}
        autoFocus
        placeholder="Player name"
        onSubmitEditing={() => onSubmit(text)}
        returnKeyType="done"
      />
    </Dialog>
  );
}
