// ---- one scoring addition --------------------------------------------------
// A "round" here is just the amount you're about to add. All the multiply /
// divide / modifier math lives inside this, so it only affects this one add.

export function emptyRound() {
  return {
    numbers: [],     // number-card face values
    modifiers: [],   // signed +/- modifiers
    multiplyX2: false,
    divideBy2: false,
    flip7: false,
    custom: 0,       // raw custom entry, can be negative
  };
}

// Order (matches both rulebooks):
//   numbers -> x2 or /2 (rounds down) -> +/- modifiers -> Flip 7 +15 -> custom
export function computeTotal(r) {
  // numbers are card objects { key, value } so each card toggles on/off
  let t = r.numbers.reduce((a, n) => a + n.value, 0);
  if (r.multiplyX2) t *= 2;
  if (r.divideBy2) t = Math.floor(t / 2);
  t += r.modifiers.reduce((a, m) => a + m.value, 0);
  if (r.flip7) t += 15;
  t += r.custom || 0;
  return t;
}

export function roundIsEmpty(r) {
  return (
    r.numbers.length === 0 &&
    r.modifiers.length === 0 &&
    !r.multiplyX2 &&
    !r.divideBy2 &&
    !r.flip7 &&
    !r.custom
  );
}

