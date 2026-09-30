import { sameName } from './names';
import {
  newId,
  applyOp,
  getIn,
  hsPath,
  winsPath,
  seasonEntriesPath,
  insertOp,
  patchOp,
  setOp,
} from './ops';
import { seasonForMonth, seasonId } from './store';
import { SEASONS } from './components/SeasonArt';

export const WIN = 200;

export const topScoreOf = (players) => players.reduce((m, p) => Math.max(m, p.score), 0);

// Builds the ops + a human summary to push the winner(s) of the current game
// into the active edition's all-time, seasonal and wins boards.
// Uses the players' CURRENT names (so a rename before syncing syncs the new name).
export function buildSync(state) {
  const ed = state.edition;
  const top = topScoreOf(state.players);
  if (top < WIN) return { error: `No one's at ${WIN} yet` };

  const winners = state.players.filter((p) => p.score === top);
  // Always the calendar season (e.g. Aug–Sep → Firecracker Summer), regardless
  // of which season is open on the Leaderboards screen.
  const theme = seasonForMonth();
  const seasonPath = seasonEntriesPath(seasonId(ed, theme));
  // Work on running copies so tied winners with the same name don't double-insert.
  let s = state;
  const ops = [];
  const lines = [];

  const push = (op) => {
    ops.push(op);
    s = applyOp(s, op);
  };

  for (const w of winners) {
    const parts = [];

    // all-time + season: raise only if higher, else insert
    const bump = (path, label) => {
      const l = getIn(s, path) || [];
      const hit = l.find((e) => sameName(e.name, w.name));
      if (!hit) {
        push(insertOp(path, { id: newId(), name: w.name, score: top }, s));
        parts.push(`${label}: new ${top}`);
      } else if (top > hit.score) {
        push(patchOp(path, hit.id, { score: top }, s));
        parts.push(`${label}: ${hit.score} → ${top}`);
      } else {
        parts.push(`${label}: kept ${hit.score}`);
      }
    };
    bump(hsPath(ed), 'All-time');
    bump(seasonPath, SEASONS[theme].label);

    const wl = s.wins[ed];
    const wh = wl.find((e) => sameName(e.name, w.name));
    if (!wh) {
      push(insertOp(winsPath(ed), { id: newId(), name: w.name, wins: 1 }, s));
      parts.push('Wins: 0 → 1');
    } else {
      push({ t: 'inc', path: winsPath(ed), id: wh.id, field: 'wins', by: 1 });
      parts.push(`Wins: ${wh.wins} → ${wh.wins + 1}`);
    }
    lines.push({ name: w.name, score: top, parts });
  }

  push(setOp(['gameSyncedAt'], Date.now(), state));
  const label = `Synced ${winners.map((w) => w.name).join(' & ')} (${top})`;
  return { ops, lines, label, top };
}
