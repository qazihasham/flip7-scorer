// Case-less, special-character-less name key: "Hasham", "hasham!", "HA SHAM" -> "hasham"
export const normName = (s) =>
  String(s || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

export const sameName = (a, b) => {
  const x = normName(a);
  return x !== '' && x === normName(b);
};
