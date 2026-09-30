// Reversible operations. Every mutation in the app is a list of these, stored
// in the history log so any entry can be undone / redone.
//
//   ins   { path, item, index }        insert item into list at path
//   del   { path, id, item, index }    remove item (item/index kept for undo)
//   patch { path, id, before, after }  shallow-merge fields on a list item
//   set   { path, before, after }      replace the value at path
//   score { path, id, amt, rev }       add amt to a player's score + history
//                                      (rev=true is the exact inverse)
//   inc   { path, id, field, by }      add `by` to a numeric field

export const getIn = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);

export const setIn = (obj, path, val) => {
  if (path.length === 0) return val;
  const [k, ...rest] = path;
  const base = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  base[k] = setIn(obj == null ? undefined : obj[k], rest, val);
  return base;
};

const list = (state, path) => getIn(state, path) || [];

export function invertOp(op) {
  switch (op.t) {
    case 'ins':
      return { t: 'del', path: op.path, id: op.item.id, item: op.item, index: op.index };
    case 'del':
      return { t: 'ins', path: op.path, item: op.item, index: op.index };
    case 'patch':
      return { ...op, before: op.after, after: op.before };
    case 'set':
      return { ...op, before: op.after, after: op.before };
    case 'score':
      return { ...op, rev: !op.rev };
    case 'inc':
      return { ...op, by: -op.by };
    default:
      return op;
  }
}

// Returns an error string if the op cannot be applied to this state, else null.
export function checkOp(state, op) {
  if (op.t === 'ins' || op.t === 'set') return null;
  const item = list(state, op.path).find((x) => x.id === op.id);
  if (!item) return 'an item it touches no longer exists';
  return null;
}

export function applyOp(state, op) {
  switch (op.t) {
    case 'ins': {
      const l = [...list(state, op.path)];
      if (l.some((x) => x.id === op.item.id)) return state;
      l.splice(Math.min(op.index, l.length), 0, op.item);
      return setIn(state, op.path, l);
    }
    case 'del':
      return setIn(
        state,
        op.path,
        list(state, op.path).filter((x) => x.id !== op.id)
      );
    case 'patch':
      return setIn(
        state,
        op.path,
        list(state, op.path).map((x) => (x.id === op.id ? { ...x, ...op.after } : x))
      );
    case 'set':
      return setIn(state, op.path, op.after);
    case 'score':
      return setIn(
        state,
        op.path,
        list(state, op.path).map((p) => {
          if (p.id !== op.id) return p;
          if (!op.rev) return { ...p, score: p.score + op.amt, history: [...p.history, op.amt] };
          const h = [...p.history];
          const i = h.lastIndexOf(op.amt);
          if (i >= 0) h.splice(i, 1);
          return { ...p, score: p.score - op.amt, history: h };
        })
      );
    case 'inc':
      return setIn(
        state,
        op.path,
        list(state, op.path).map((x) =>
          x.id === op.id ? { ...x, [op.field]: (x[op.field] || 0) + op.by } : x
        )
      );
    default:
      return state;
  }
}

export const applyOps = (state, ops) => ops.reduce(applyOp, state);
export const invertOps = (ops) => [...ops].reverse().map(invertOp);

// ---- op builders -----------------------------------------------------------

export const newId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const P = ['players'];
export const hsPath = (ed) => ['highScores', ed];
export const winsPath = (ed) => ['wins', ed];
export const seasonListPath = (ed) => ['seasons', ed, 'list'];
export const seasonEntriesPath = (seasonId) => ['seasonEntries', seasonId];

export const insertOp = (path, item, state) => ({
  t: 'ins',
  path,
  item,
  index: list(state, path).length,
});

export const deleteOp = (path, id, state) => {
  const l = list(state, path);
  const index = l.findIndex((x) => x.id === id);
  return { t: 'del', path, id, item: l[index], index };
};

export const patchOp = (path, id, changes, state) => {
  const item = list(state, path).find((x) => x.id === id) || {};
  const before = {};
  Object.keys(changes).forEach((k) => (before[k] = item[k]));
  return { t: 'patch', path, id, before, after: changes };
};

export const setOp = (path, after, state) => ({ t: 'set', path, before: getIn(state, path), after });

export const currentSeason = (state, ed) => {
  const s = state.seasons[ed];
  return s.list.find((x) => x.id === s.currentId) || s.list[s.list.length - 1];
};
