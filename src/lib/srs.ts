// Spaced repetition using the SM-2 algorithm (the scheduler behind classic
// Anki / SuperMemo 2). Grades: 0 = forgot, 3 = hard, 4 = good, 5 = easy.

export interface Card {
  id: string;
  front: string; // English term or phrase
  back: string; // Spanish meaning
  example?: string;
  ease: number;
  interval: number; // days
  reps: number;
  due: number; // epoch ms
}

export type Grade = 0 | 3 | 4 | 5;

const DAY = 24 * 60 * 60 * 1000;

export function newCard(front: string, back: string, example?: string): Card {
  return {
    id: `${front.toLowerCase().trim()}`,
    front,
    back,
    example,
    ease: 2.5,
    interval: 0,
    reps: 0,
    due: Date.now(),
  };
}

export function review(card: Card, grade: Grade, now = Date.now()): Card {
  if (grade < 3) {
    // Lapse: relearn soon (10 minutes) and reset the repetition count.
    return { ...card, reps: 0, interval: 0, due: now + 10 * 60 * 1000 };
  }
  const reps = card.reps + 1;
  const interval =
    reps === 1 ? 1 : reps === 2 ? 6 : Math.round(card.interval * card.ease);
  const ease = Math.max(
    1.3,
    card.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)),
  );
  return { ...card, reps, interval, ease, due: now + interval * DAY };
}

export function dueCards(cards: Card[], now = Date.now()): Card[] {
  return cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
}
