import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyOps, invertOps, checkOp, newId } from './ops';
import { SEASONS } from './components/SeasonArt';

const KEY = 'flip7_state_v2';
const OLD_PLAYERS = 'flip7_players_v1';
const OLD_HS = 'flip7_highscores_v1';
const HISTORY_CAP = 300;
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // history entries expire after 24 hours

export const EDITIONS = ['classic', 'vengeance'];
export const EDITION_LABEL = { classic: 'Flip 7', vengeance: 'With a Vengeance' };


// Six fixed 2-month seasons per edition. Scores live in each season until you
// reset them by hand, so the same season next year keeps accumulating.
export const SEASON_ORDER = ['frosty', 'love', 'spring', 'summer', 'fireworks', 'spooky'];
// Dec-Jan, Feb-Mar, Apr-May, Jun-Jul, Aug-Sep, Oct-Nov
export const seasonForMonth = (d = new Date()) =>
  SEASON_ORDER[Math.floor(((d.getMonth() + 1) % 12) / 2)];
export const seasonId = (ed, theme) => `${ed}_${theme}`;

const LEGACY_THEME = { fall: 'spooky', winter: 'frosty', holiday: 'frosty', lunar: 'love' };

const makeSeasons = (ed) => ({
  currentId: seasonId(ed, seasonForMonth()),
  list: SEASON_ORDER.map((theme) => ({
    id: seasonId(ed, theme),
    theme,
    name: SEASONS[theme].label,
    months: SEASONS[theme].months,
  })),
});

export function initialState() {
  const seasonEntries = {};
  EDITIONS.forEach((ed) => SEASON_ORDER.forEach((th) => (seasonEntries[seasonId(ed, th)] = [])));
  return {
    edition: 'classic',
    players: [],
    gameSyncedAt: null,
    highScores: { classic: [], vengeance: [] },
    wins: { classic: [], vengeance: [] },
    seasons: { classic: makeSeasons('classic'), vengeance: makeSeasons('vengeance') },
    seasonEntries,
    history: [],
  };
}

// Older saves had free-form seasons with random ids; fold their scores into
// the fixed season that matches their theme (or the current one).
function migrateSeasons(s) {
  const fixed = (ed) =>
    s.seasons[ed].list.length === SEASON_ORDER.length &&
    s.seasons[ed].list.every((x) => x.id === seasonId(ed, x.theme));
  if (EDITIONS.every(fixed)) return s;
  const fresh = initialState();
  const out = { ...s, seasons: fresh.seasons, seasonEntries: fresh.seasonEntries, history: [] };
  EDITIONS.forEach((ed) => {
    s.seasons[ed].list.forEach((old) => {
      let th = LEGACY_THEME[old.theme] || old.theme;
      if (!SEASON_ORDER.includes(th)) th = seasonForMonth();
      const id = seasonId(ed, th);
      out.seasonEntries[id] = [...out.seasonEntries[id], ...(s.seasonEntries[old.id] || [])];
    });
  });
  return out;
}

async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return migrateSeasons({ ...initialState(), ...JSON.parse(raw) });
    const base = initialState();
    const p = await AsyncStorage.getItem(OLD_PLAYERS);
    const h = await AsyncStorage.getItem(OLD_HS);
    if (p) base.players = JSON.parse(p);
    if (h) base.highScores.classic = JSON.parse(h);
    return base;
  } catch (e) {
    return initialState();
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return action.state;
    case 'DO': {
      const next = applyOps(state, action.entry.ops);
      return { ...next, history: [action.entry, ...next.history].slice(0, HISTORY_CAP) };
    }
    case 'TOGGLE': {
      const e = state.history.find((x) => x.id === action.id);
      if (!e) return state;
      const ops = e.undone ? e.ops : invertOps(e.ops);
      const next = applyOps(state, ops);
      return {
        ...next,
        history: next.history.map((x) => (x.id === e.id ? { ...x, undone: !x.undone } : x)),
      };
    }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'PRUNE': {
      const cutoff = Date.now() - HISTORY_TTL_MS;
      const kept = state.history.filter((h) => h.ts >= cutoff);
      return kept.length === state.history.length ? state : { ...state, history: kept };
    }
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const [loaded, setLoaded] = React.useState(false);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    (async () => {
      dispatch({ type: 'LOAD', state: await loadState() });
      dispatch({ type: 'PRUNE' });
      setLoaded(true);
    })();
  }, []);

  // Drop history older than 24h: on open, when returning to the app, and every 5 min.
  useEffect(() => {
    const prune = () => dispatch({ type: 'PRUNE' });
    const sub = AppState.addEventListener('change', (s) => s === 'active' && prune());
    const id = setInterval(prune, 5 * 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [state, loaded]);

  const api = useMemo(
    () => ({
      // screen: 'game' | 'board' | 'sync'
      run(screen, label, ops) {
        if (!ops || ops.length === 0) return;
        dispatch({
          type: 'DO',
          entry: { id: newId(), ts: Date.now(), screen, label, ops, undone: false },
        });
      },
      // Returns { ok, msg }. Validates against current state first.
      toggleEntry(id) {
        const s = ref.current;
        const e = s.history.find((x) => x.id === id);
        if (!e) return { ok: false, msg: 'Entry not found' };
        const ops = e.undone ? e.ops : invertOps(e.ops);
        for (const op of ops) {
          const err = checkOp(s, op);
          if (err) return { ok: false, msg: `Can't ${e.undone ? 'redo' : 'undo'}: ${err}.` };
        }
        dispatch({ type: 'TOGGLE', id });
        return { ok: true, msg: e.undone ? 'Redone' : 'Undone' };
      },
      clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
      getState: () => ref.current,
    }),
    []
  );

  const value = useMemo(() => ({ state, ...api, loaded }), [state, api, loaded]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
