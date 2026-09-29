// Common European Framework of Reference (CEFR) levels and their mapping to
// the latent ability scale (theta, in logits) used by the adaptive test.

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const LEVEL_INFO: Record<
  CefrLevel,
  { name: string; canDo: string; center: number }
> = {
  A1: {
    name: "Principiante",
    canDo: "Entiendes y usas frases muy básicas para necesidades concretas.",
    center: -2.5,
  },
  A2: {
    name: "Elemental",
    canDo: "Te comunicas en tareas simples y rutinarias sobre temas conocidos.",
    center: -1.5,
  },
  B1: {
    name: "Intermedio",
    canDo: "Te defiendes en viajes y hablas de experiencias, planes y opiniones.",
    center: -0.5,
  },
  B2: {
    name: "Intermedio alto",
    canDo: "Conversas con fluidez con nativos y entiendes textos complejos.",
    center: 0.5,
  },
  C1: {
    name: "Avanzado",
    canDo: "Usas el idioma de forma flexible en contextos académicos y laborales.",
    center: 1.5,
  },
  C2: {
    name: "Maestría",
    canDo: "Entiendes prácticamente todo y te expresas con precisión y matices.",
    center: 2.5,
  },
};

// Cut points between adjacent levels on the theta scale.
const CUTS = [-2, -1, 0, 1, 2];

export function thetaToLevel(theta: number): CefrLevel {
  const idx = CUTS.findIndex((c) => theta < c);
  return CEFR_LEVELS[idx === -1 ? CEFR_LEVELS.length - 1 : idx];
}

export function levelIndex(level: CefrLevel): number {
  return CEFR_LEVELS.indexOf(level);
}

export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === "string" && (CEFR_LEVELS as readonly string[]).includes(value);
}
