"use client";

// Learner profile, persisted in localStorage. Everything lives on the device;
// there is no account system yet.

import { useCallback, useSyncExternalStore } from "react";
import type { CefrLevel } from "./cefr";
import type { Skill } from "./itemBank";
import type { AssessmentResult } from "./schemas";
import { newCard, type Card } from "./srs";

export interface Profile {
  name: string;
  goal: string;
  level: CefrLevel;
  theta: number;
  skills: Record<Skill, number | null>;
  assessment: AssessmentResult;
  assessedAt: number;
  xp: number;
  streak: { count: number; lastDay: string };
  cards: Card[];
  weakPoints: string[];
  lessonsDone: number;
  conversations: number;
}

const KEY = "learnai.profile.v1";
const EVENT = "learnai:profile";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage full or blocked: keep working in memory for this session.
  }
  window.dispatchEvent(new Event(EVENT));
}

// Cache the parsed profile by its raw string so useSyncExternalStore gets a
// stable snapshot between changes.
let cachedRaw: string | null = null;
let cachedProfile: Profile | null = null;

function snapshot(): Profile | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cachedProfile;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedProfile = raw ? (JSON.parse(raw) as Profile) : null;
    } catch {
      cachedProfile = null;
    }
  }
  return cachedProfile;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const noopSubscribe = () => () => {};

export function useProfile() {
  const profile = useSyncExternalStore(subscribe, snapshot, () => null);
  // False during server render and hydration, true once running in the browser.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const update = useCallback((fn: (p: Profile) => Profile) => {
    const current = loadProfile();
    if (current) saveProfile(fn(current));
  }, []);

  return { profile, ready, update };
}

/** Adds XP and advances the daily streak (a missed day resets it). */
export function earn(p: Profile, xp: number): Profile {
  const t = today();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let count = p.streak.count;
  if (p.streak.lastDay !== t) count = p.streak.lastDay === yesterday ? count + 1 : 1;
  return { ...p, xp: p.xp + xp, streak: { count, lastDay: t } };
}

/** Adds vocabulary to the spaced-repetition deck, skipping duplicates. */
export function addCards(
  p: Profile,
  items: { term: string; meaning_es: string; example?: string }[],
): Profile {
  const existing = new Set(p.cards.map((c) => c.id));
  const fresh = items
    .map((v) => newCard(v.term, v.meaning_es, v.example))
    .filter((c) => !existing.has(c.id) && existing.add(c.id));
  return { ...p, cards: [...p.cards, ...fresh] };
}

/** Records weak points reported by the AI (most recent first, capped). */
export function addWeakPoints(p: Profile, points: string[]): Profile {
  const merged = [...points, ...p.weakPoints.filter((w) => !points.includes(w))];
  return { ...p, weakPoints: merged.slice(0, 12) };
}

export function currentStreak(p: Profile): number {
  const t = today();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return p.streak.lastDay === t || p.streak.lastDay === yesterday ? p.streak.count : 0;
}
