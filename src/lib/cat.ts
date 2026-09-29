// Computerized Adaptive Testing (CAT) under the Rasch (1PL IRT) model.
//
// - Ability is estimated with EAP (expected a posteriori) over a quadrature
//   grid with a N(0, 1.5^2) prior, which is stable from the first response.
// - The next item maximizes Fisher information at the current estimate, with
//   light skill balancing so every skill gets sampled.
// - The test stops once the standard error is small enough or MAX_ITEMS is hit.

import { ITEM_BANK, type Item, type Skill } from "./itemBank";

export const MIN_ITEMS = 12;
export const MAX_ITEMS = 18;
const TARGET_SE = 0.5;
const PRIOR_SD = 1.5;
const GRID = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);

export interface Response {
  itemId: string;
  correct: boolean;
}

export interface Estimate {
  theta: number;
  se: number;
}

function pCorrect(theta: number, b: number): number {
  return 1 / (1 + Math.exp(-(theta - b)));
}

function itemById(id: string): Item {
  const item = ITEM_BANK.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown item ${id}`);
  return item;
}

export function estimate(responses: Response[]): Estimate {
  const logPost = GRID.map((t) => {
    let lp = -(t * t) / (2 * PRIOR_SD * PRIOR_SD);
    for (const r of responses) {
      const p = pCorrect(t, itemById(r.itemId).b);
      lp += Math.log(r.correct ? p : 1 - p);
    }
    return lp;
  });
  const max = Math.max(...logPost);
  const w = logPost.map((lp) => Math.exp(lp - max));
  const total = w.reduce((a, b) => a + b, 0);
  const theta = GRID.reduce((acc, t, i) => acc + t * w[i], 0) / total;
  const variance =
    GRID.reduce((acc, t, i) => acc + (t - theta) ** 2 * w[i], 0) / total;
  return { theta, se: Math.sqrt(variance) };
}

export function nextItem(responses: Response[]): Item | null {
  const { theta, se } = estimate(responses);
  const n = responses.length;
  if (n >= MAX_ITEMS || (n >= MIN_ITEMS && se <= TARGET_SE)) return null;

  const used = new Set(responses.map((r) => r.itemId));
  const available = ITEM_BANK.filter((i) => !used.has(i.id));
  if (available.length === 0) return null;

  const skillCounts = new Map<Skill, number>();
  for (const r of responses) {
    const s = itemById(r.itemId).skill;
    skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1);
  }
  const minCount = Math.min(
    ...(["grammar", "vocabulary", "reading", "listening"] as Skill[]).map(
      (s) => skillCounts.get(s) ?? 0,
    ),
  );

  // Fisher information for Rasch is p(1-p); a small penalty on over-sampled
  // skills keeps the profile balanced without sacrificing much precision.
  const score = (item: Item) => {
    const p = pCorrect(theta, item.b);
    const info = p * (1 - p);
    const excess = (skillCounts.get(item.skill) ?? 0) - minCount;
    return info - 0.04 * excess;
  };
  return available.reduce((best, item) => (score(item) > score(best) ? item : best));
}

/** Per-skill proportion correct, used as a coarse diagnostic profile. */
export function skillProfile(responses: Response[]): Record<Skill, number | null> {
  const acc: Record<Skill, { c: number; n: number }> = {
    grammar: { c: 0, n: 0 },
    vocabulary: { c: 0, n: 0 },
    reading: { c: 0, n: 0 },
    listening: { c: 0, n: 0 },
  };
  for (const r of responses) {
    const s = acc[itemById(r.itemId).skill];
    s.n += 1;
    if (r.correct) s.c += 1;
  }
  return Object.fromEntries(
    Object.entries(acc).map(([k, v]) => [k, v.n ? v.c / v.n : null]),
  ) as Record<Skill, number | null>;
}
