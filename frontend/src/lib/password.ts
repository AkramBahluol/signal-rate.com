export const PASSWORD_GROUPS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};
const ambiguous = new Set("0Oo1lI".split(""));
export function passwordSpace(
  groups: (keyof typeof PASSWORD_GROUPS)[],
  exclude = false,
  custom = "",
) {
  return (groups.map((g) => PASSWORD_GROUPS[g]).join("") + (custom || ""))
    .split("")
    .filter((c, i, a) => a.indexOf(c) === i && (!exclude || !ambiguous.has(c)))
    .join("");
}
export function securePassword(
  length: number,
  space: string,
  random: () => number = () => {
    const x = new Uint32Array(1);
    crypto.getRandomValues(x);
    return x[0];
  },
) {
  if (length < 4 || length > 128 || space.length < 2)
    throw new Error("Invalid password options");
  const max = Math.floor(0x100000000 / space.length) * space.length;
  let out = "";
  while (out.length < length) {
    const n = random();
    if (n < max) out += space[n % space.length];
  }
  return out;
}
export function entropyBits(length: number, spaceSize: number) {
  return length * Math.log2(spaceSize);
}
export function strength(bits: number) {
  return bits < 50
    ? "Weak"
    : bits < 70
      ? "Fair"
      : bits < 100
        ? "Strong"
        : "Very Strong";
}
