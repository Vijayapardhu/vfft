/**
 * Round-robin fixture generation (SRS §10) via the circle method.
 * Single = each pair once; double = home & away. Pure + deterministic.
 */
export function generateRoundRobin(
  teamIds: string[],
  double = false,
): Array<[string, string]> {
  if (teamIds.length < 2) return [];

  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push("__BYE__");
  const n = teams.length;
  const arr = [...teams];
  const pairs: Array<[string, string]> = [];

  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i] as string;
      const b = arr[n - 1 - i] as string;
      if (a !== "__BYE__" && b !== "__BYE__") {
        // Alternate home/away by round for fairness.
        pairs.push(round % 2 === 0 ? [a, b] : [b, a]);
      }
    }
    // Rotate everything except the first element.
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string);
    arr.splice(1, arr.length - 1, ...rest);
  }

  return double
    ? pairs.concat(pairs.map(([a, b]) => [b, a] as [string, string]))
    : pairs;
}
