/**
 * Round-robin fixture generation (SRS §10) via the circle method.
 *
 * `cycles` = how many times every pair meets:
 *   1 = single, 2 = double (home & away), 3 = triple, …
 *
 * Each extra cycle flips home/away from the previous one for fairness, so a
 * triple round robin reads: base → reversed → base. Pure + deterministic.
 *
 * Match count = cycles × n × (n − 1) / 2.
 */
export function generateRoundRobin(
  teamIds: string[],
  cycles = 1,
): Array<[string, string]> {
  if (teamIds.length < 2 || cycles < 1) return [];

  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push("__BYE__");
  const n = teams.length;
  const arr = [...teams];

  // One full single round robin (the "base" cycle).
  const base: Array<[string, string]> = [];
  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i] as string;
      const b = arr[n - 1 - i] as string;
      if (a !== "__BYE__" && b !== "__BYE__") {
        // Alternate home/away by round for fairness.
        base.push(round % 2 === 0 ? [a, b] : [b, a]);
      }
    }
    // Rotate everything except the first element.
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string);
    arr.splice(1, arr.length - 1, ...rest);
  }

  // Repeat the base for each cycle, flipping home/away on odd cycles.
  const all: Array<[string, string]> = [];
  for (let c = 0; c < cycles; c++) {
    for (const [a, b] of base) {
      all.push(c % 2 === 0 ? [a, b] : [b, a]);
    }
  }
  return all;
}
