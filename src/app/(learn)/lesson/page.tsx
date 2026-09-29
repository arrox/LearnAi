"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import TutorBubble from "@/components/TutorBubble";
import { postJSON } from "@/lib/api";
import { addCards, earn, useProfile } from "@/lib/profile";
import type { Exercise, GradeResult, Lesson } from "@/lib/schemas";
import { useSpeaker } from "@/lib/speech";
import Link from "next/link";

type Phase = "pick" | "loading" | "read" | "practice" | "done" | "error";

const TOPICS = ["Viajes", "Trabajo y reuniones", "Comida", "Tecnología", "Salud", "Cine y series", "Dinero"];

function normalize(s: string) {
  return s.toLowerCase().replace(/[.,!?;:'"’]/g, "").replace(/\s+/g, " ").trim();
}

export default function LessonPage() {
  const { profile, update } = useProfile();
  const { speak, stop, speaking } = useSpeaker();
  const [phase, setPhase] = useState<Phase>("pick");
  const [topic, setTopic] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  if (!profile) return null;

  async function load(t: string) {
    setTopic(t);
    setPhase("loading");
    try {
      const l = await postJSON<Lesson>("/api/lesson", {
        level: profile!.level,
        topic: t || undefined,
        weakPoints: profile!.weakPoints,
        goal: profile!.goal,
      });
      setLesson(l);
      setIdx(0);
      setScore(0);
      setPhase("read");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  function finish(finalScore: number) {
    if (!lesson) return;
    update((p) => {
      const withCards = addCards(p, lesson.reading.glossary);
      return { ...earn(withCards, 20 + finalScore * 5), lessonsDone: p.lessonsDone + 1 };
    });
    setPhase("done");
  }

  if (phase === "pick") {
    return (
      <div className="flex flex-col gap-5">
        <TutorBubble
          mood="encouraging"
          text={`Vamos con una lección de nivel ${profile.level}. Elige un tema o déjame sorprenderte.`}
        />
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button key={t} className="option !w-auto" onClick={() => load(t)}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => load("")}>
          ✨ Sorpréndeme
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <Avatar mood="thinking" size={140} />
        <p className="font-bold">Preparando tu lección{topic ? ` sobre ${topic.toLowerCase()}` : ""}…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-4">
        <TutorBubble mood="sad" text={`No pude crear la lección: ${error}`} />
        <button className="btn btn-primary" onClick={() => load(topic)}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!lesson) return null;

  if (phase === "read") {
    return (
      <article className="flex flex-col gap-5">
        <header>
          <p className="text-sm font-extrabold text-muted uppercase">Lección · {profile.level}</p>
          <h1 className="text-2xl font-black">{lesson.title}</h1>
          <p className="text-muted">{lesson.objective_es}</p>
        </header>

        <section className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-extrabold">📖 Lectura</h2>
            <button
              className="text-sm font-bold text-accent"
              onClick={() => (speaking ? stop() : speak(lesson.reading.text, 0.9))}
            >
              {speaking ? "⏹ Detener" : "🔊 Escuchar"}
            </button>
          </div>
          <p className="text-lg leading-relaxed whitespace-pre-line">{lesson.reading.text}</p>
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-extrabold">🗂 Vocabulario</h2>
          <ul className="flex flex-col gap-2">
            {lesson.reading.glossary.map((g) => (
              <li key={g.term} className="text-sm">
                <button className="font-extrabold text-accent" onClick={() => speak(g.term, 0.85)}>
                  {g.term}
                </button>{" "}
                — {g.meaning_es}
                <p className="text-muted italic">{g.example}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="font-extrabold">✏️ Gramática: {lesson.grammar_focus.point}</h2>
          <p className="mt-1 text-sm">{lesson.grammar_focus.explanation_es}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted">
            {lesson.grammar_focus.examples.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </section>

        <button className="btn btn-primary" onClick={() => setPhase("practice")}>
          Practicar ({lesson.exercises.length} ejercicios)
        </button>
      </article>
    );
  }

  if (phase === "practice") {
    const ex = lesson.exercises[idx];
    return (
      <div className="flex flex-col gap-4">
        <div className="h-3 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(idx / lesson.exercises.length) * 100}%` }}
          />
        </div>
        <ExerciseCard
          key={idx}
          ex={ex}
          level={profile.level}
          onNext={(ok) => {
            const s = score + (ok ? 1 : 0);
            setScore(s);
            if (idx + 1 < lesson.exercises.length) setIdx(idx + 1);
            else finish(s);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      <Avatar mood="happy" size={150} />
      <h1 className="text-2xl font-black">¡Lección completada!</h1>
      <p className="text-lg">
        {score} / {lesson.exercises.length} correctas · +{20 + score * 5} XP
      </p>
      <p className="max-w-sm text-sm text-muted">
        Agregué {lesson.reading.glossary.length} palabras a tu repaso espaciado. Ahora ponlas en uso:
      </p>
      <div className="card max-w-md p-4 text-left">
        <p className="text-sm font-extrabold text-muted uppercase">Tarea oral</p>
        <p>{lesson.speaking_task}</p>
      </div>
      <Link
        href={`/chat?scenario=${encodeURIComponent(lesson.speaking_task)}`}
        className="btn btn-primary"
      >
        Practicar con Lexi
      </Link>
      <button className="btn btn-ghost" onClick={() => setPhase("pick")}>
        Otra lección
      </button>
    </div>
  );
}

function ExerciseCard({
  ex,
  level,
  onNext,
}: {
  ex: Exercise;
  level: string;
  onNext: (correct: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; feedback: string; corrected: string } | null>(null);

  async function check() {
    if (ex.type === "multiple_choice" || normalize(value) === normalize(ex.answer)) {
      const ok = normalize(value) === normalize(ex.answer);
      setResult({ ok, feedback: ex.explanation_es, corrected: ex.answer });
      return;
    }
    // Free-text answers that differ from the key may still be right: ask the AI.
    setChecking(true);
    try {
      const g = await postJSON<GradeResult>("/api/grade", {
        level,
        question: ex.question,
        expected: ex.answer,
        answer: value,
      });
      setResult({ ok: g.correct, feedback: g.feedback_es, corrected: g.corrected });
    } catch {
      setResult({ ok: false, feedback: ex.explanation_es, corrected: ex.answer });
    } finally {
      setChecking(false);
    }
  }

  const label = { multiple_choice: "Elige la respuesta", fill_gap: "Completa el espacio", translate: "Traduce al inglés" }[
    ex.type
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-extrabold text-muted uppercase">{label}</p>
      <h2 className="text-xl font-extrabold">{ex.question}</h2>

      {ex.type === "multiple_choice" ? (
        <div className="flex flex-col gap-3">
          {ex.options.map((o) => (
            <button
              key={o}
              className="option"
              disabled={!!result}
              data-state={
                result
                  ? normalize(o) === normalize(ex.answer)
                    ? "correct"
                    : o === value
                      ? "wrong"
                      : undefined
                  : o === value
                    ? "selected"
                    : undefined
              }
              onClick={() => setValue(o)}
            >
              {o}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!!result}
          rows={ex.type === "translate" ? 3 : 2}
          spellCheck={false}
          autoCorrect="off"
          className="rounded-xl border-2 border-line bg-surface p-3 text-lg"
          placeholder="Escribe en inglés…"
        />
      )}

      {result ? (
        <div className={`rounded-2xl p-4 ${result.ok ? "bg-good-bg" : "bg-bad-bg"}`}>
          <p className={`font-black ${result.ok ? "text-good" : "text-bad"}`}>
            {result.ok ? "¡Correcto!" : "Casi…"}
          </p>
          {!result.ok && (
            <p className="text-sm">
              Respuesta: <strong>{result.corrected}</strong>
            </p>
          )}
          <p className="mt-1 text-sm">{result.feedback}</p>
          <button className="btn btn-primary mt-3 w-full" onClick={() => onNext(result.ok)}>
            Continuar
          </button>
        </div>
      ) : (
        <button className="btn btn-primary" disabled={!value.trim() || checking} onClick={check}>
          {checking ? "Revisando…" : "Comprobar"}
        </button>
      )}
    </div>
  );
}
