"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import TutorBubble from "@/components/TutorBubble";
import { postJSON } from "@/lib/api";
import { MAX_ITEMS, nextItem, estimate, skillProfile } from "@/lib/cat";
import { LEVEL_INFO, thetaToLevel, type CefrLevel } from "@/lib/cefr";
import { ITEM_BANK, SKILL_LABEL, type Skill } from "@/lib/itemBank";
import { addWeakPoints, earn, loadProfile, saveProfile, type Profile } from "@/lib/profile";
import type { AssessmentResult } from "@/lib/schemas";
import { useListener, useSpeaker } from "@/lib/speech";

type Step = "intro" | "test" | "writing" | "speaking" | "evaluating" | "result" | "error";

interface ApiResponse {
  result: AssessmentResult;
  test: { theta: number; se: number; level: CefrLevel; profile: Record<Skill, number | null> };
}

const GOALS = ["Trabajo", "Viajes", "Estudios / examen", "Conversar con fluidez", "Por gusto"];

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(GOALS[0]);
  const [answers, setAnswers] = useState<{ itemId: string; choice: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [writing, setWriting] = useState("");
  const [speaking, setSpeaking] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const speaker = useSpeaker();
  const listener = useListener((t) => setSpeaking((s) => (s ? `${s} ${t}` : t)));

  const responses = useMemo(
    () =>
      answers.map((a) => ({
        itemId: a.itemId,
        correct: ITEM_BANK.find((i) => i.id === a.itemId)?.answer === a.choice,
      })),
    [answers],
  );
  const item = useMemo(() => (step === "test" ? nextItem(responses) : null), [step, responses]);

  // Listening items are read aloud automatically when they appear.
  const lastSpoken = useRef<string | null>(null);
  const { speak } = speaker;
  useEffect(() => {
    if (item?.skill === "listening" && item.passage && lastSpoken.current !== item.id) {
      lastSpoken.current = item.id;
      speak(item.passage, 0.9);
    }
  }, [item, speak]);

  function record(choice: number) {
    if (!item) return;
    const next = [...answers, { itemId: item.id, choice }];
    setAnswers(next);
    setSelected(null);
    // Move on once the adaptive engine decides it has enough precision.
    const scored = next.map((a) => ({
      itemId: a.itemId,
      correct: ITEM_BANK.find((i) => i.id === a.itemId)?.answer === a.choice,
    }));
    if (!nextItem(scored)) setStep("writing");
  }

  async function evaluate() {
    setStep("evaluating");
    setError("");
    try {
      const res = await postJSON<ApiResponse>("/api/assessment", {
        answers,
        writing,
        speaking: speaking || undefined,
        goal,
      });
      setData(res);
      setStep("result");
      speak(res.result.avatar_message);
    } catch (e) {
      setError((e as Error).message);
      setStep("error");
    }
  }

  // Test-only placement, for when the AI is unavailable.
  function testOnlyResult(): ApiResponse {
    const { theta, se } = estimate(responses);
    const level = thetaToLevel(theta);
    return {
      test: { theta, se, level, profile: skillProfile(responses) },
      result: {
        level,
        confidence: "low",
        writing_level: level,
        speaking_level: null,
        summary_es:
          "Nivel estimado solo con el test de opción múltiple. Tu escritura y tu habla no se evaluaron, así que tómalo como referencia inicial.",
        strengths: [],
        weaknesses: [],
        focus_areas: [],
        writing_corrections: [],
        study_plan: [],
        avatar_message: "Great job! Let's start learning together.",
      },
    };
  }

  function start(res: ApiResponse) {
    const prev = loadProfile();
    let profile: Profile = {
      name: name.trim() || prev?.name || "",
      goal,
      level: res.result.level,
      theta: res.test.theta,
      skills: res.test.profile,
      assessment: res.result,
      assessedAt: Date.now(),
      xp: prev?.xp ?? 0,
      streak: prev?.streak ?? { count: 0, lastDay: "" },
      cards: prev?.cards ?? [],
      weakPoints: prev?.weakPoints ?? [],
      lessonsDone: prev?.lessonsDone ?? 0,
      conversations: prev?.conversations ?? 0,
    };
    profile = addWeakPoints(profile, res.result.focus_areas);
    profile = earn(profile, 50);
    saveProfile(profile);
    router.push("/dashboard");
  }

  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-2xl text-muted" aria-label="Salir">
          ✕
        </Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress(step, answers.length)}%` }}
          />
        </div>
      </div>

      {step === "intro" && (
        <section className="flex flex-col gap-6">
          <TutorBubble
            mood="happy"
            text="Hi! I'm Lexi. Primero vamos a descubrir tu nivel real de inglés: unas preguntas que se adaptan a ti, un texto corto y, si quieres, una respuesta hablada. Toma unos 10 minutos."
          />
          <label className="flex flex-col gap-1 font-bold">
            ¿Cómo te llamas?
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="rounded-xl border-2 border-line bg-surface px-4 py-3 font-semibold"
              placeholder="Tu nombre"
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">¿Para qué quieres aprender inglés?</legend>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className="option !w-auto"
                  data-state={goal === g ? "selected" : undefined}
                >
                  {g}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="text-sm text-muted">
            Si no sabes una respuesta, elige la que te parezca más probable: adivinar no te perjudica, el test
            se ajusta solo.
          </p>
          <button className="btn btn-primary" onClick={() => setStep("test")}>
            Empezar
          </button>
        </section>
      )}

      {step === "test" && item && (
        <section className="flex flex-1 flex-col gap-5">
          <p className="text-sm font-extrabold text-muted uppercase">
            {SKILL_LABEL[item.skill]} · Pregunta {answers.length + 1}
          </p>
          {item.skill === "listening" ? (
            <div className="flex items-center gap-4">
              <Avatar mood="idle" talking={speaker.speaking} size={90} />
              <button className="btn btn-ghost" onClick={() => speak(item.passage ?? "", 0.9)}>
                🔊 Escuchar de nuevo
              </button>
            </div>
          ) : item.passage ? (
            <blockquote className="card p-4 text-lg leading-relaxed">{item.passage}</blockquote>
          ) : null}
          <h2 className="text-2xl font-extrabold">{item.prompt}</h2>
          <div className="flex flex-col gap-3">
            {item.options.map((opt, i) => (
              <button
                key={opt}
                className="option"
                data-state={selected === i ? "selected" : undefined}
                onClick={() => setSelected(i)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-auto flex gap-3 pt-4">
            <button
              className="btn btn-ghost"
              onClick={() => record(-1)}
            >
              No sé
            </button>
            <button className="btn btn-primary flex-1" disabled={selected === null} onClick={() => selected !== null && record(selected)}>
              Comprobar
            </button>
          </div>
        </section>
      )}

      {step === "writing" && (
        <section className="flex flex-1 flex-col gap-4">
          <TutorBubble
            mood="encouraging"
            text="¡Bien! Ahora escribe en inglés: describe tu rutina diaria y una meta que tengas para este año (60 a 120 palabras). No uses traductor: quiero ver cómo escribes tú."
          />
          <textarea
            value={writing}
            onChange={(e) => setWriting(e.target.value)}
            rows={8}
            maxLength={3000}
            spellCheck={false}
            autoCorrect="off"
            className="rounded-xl border-2 border-line bg-surface p-4 text-lg"
            placeholder="Every day I…"
          />
          <p className="text-sm text-muted">{words(writing)} palabras</p>
          <div className="mt-auto flex gap-3">
            <button className="btn btn-ghost" onClick={() => setStep("speaking")}>
              Aún no puedo
            </button>
            <button
              className="btn btn-primary flex-1"
              disabled={words(writing) < 10}
              onClick={() => setStep("speaking")}
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      {step === "speaking" && (
        <section className="flex flex-1 flex-col gap-4">
          <TutorBubble
            mood="happy"
            talking={speaker.speaking}
            text="Último paso (opcional): cuéntame en voz alta sobre un lugar que te gustaría visitar y por qué. Habla unos 30 a 60 segundos."
            onSpeak={() => speak("Tell me about a place you'd like to visit, and why.")}
          />
          {listener.supported ? (
            <button
              className={`btn ${listener.listening ? "btn-brand" : "btn-primary"}`}
              onClick={listener.listening ? listener.stop : listener.start}
            >
              {listener.listening ? "⏹ Terminar" : "🎙 Grabar respuesta"}
            </button>
          ) : (
            <p className="text-sm text-muted">
              Tu navegador no permite reconocimiento de voz (prueba con Chrome o Edge). Puedes escribir la
              respuesta como si la dijeras.
            </p>
          )}
          <textarea
            value={listener.listening ? listener.interim : speaking}
            onChange={(e) => setSpeaking(e.target.value)}
            readOnly={listener.listening}
            rows={5}
            className="rounded-xl border-2 border-line bg-surface p-4"
            placeholder="Aquí aparecerá la transcripción…"
          />
          <div className="mt-auto flex gap-3">
            <button className="btn btn-ghost" onClick={() => { setSpeaking(""); evaluate(); }}>
              Saltar
            </button>
            <button className="btn btn-primary flex-1" disabled={listener.listening} onClick={evaluate}>
              Ver mi nivel
            </button>
          </div>
        </section>
      )}

      {step === "evaluating" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Avatar mood="thinking" size={150} />
          <p className="text-lg font-bold">Lexi está analizando tus respuestas…</p>
          <p className="text-sm text-muted">Combina el test adaptativo con tu escritura y tu habla.</p>
        </section>
      )}

      {step === "error" && (
        <section className="flex flex-1 flex-col gap-4">
          <TutorBubble mood="sad" text={`No pude completar la evaluación con IA: ${error}`} />
          <button className="btn btn-primary" onClick={evaluate}>
            Reintentar
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setData(testOnlyResult());
              setStep("result");
            }}
          >
            Usar solo el resultado del test
          </button>
        </section>
      )}

      {step === "result" && data && <ResultView data={data} onStart={() => start(data)} />}
    </main>
  );
}

function progress(step: Step, answered: number): number {
  switch (step) {
    case "intro":
      return 2;
    case "test":
      return 5 + (answered / MAX_ITEMS) * 65;
    case "writing":
      return 75;
    case "speaking":
      return 88;
    default:
      return 100;
  }
}

function ResultView({ data, onStart }: { data: ApiResponse; onStart: () => void }) {
  const { result, test } = data;
  const info = LEVEL_INFO[result.level];
  const confidence = { low: "baja", medium: "media", high: "alta" }[result.confidence];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col items-center text-center">
        <Avatar mood="happy" size={130} />
        <p className="mt-2 text-sm font-extrabold text-muted uppercase">Tu nivel</p>
        <p className="text-6xl font-black text-accent">{result.level}</p>
        <p className="text-lg font-extrabold">{info.name}</p>
        <p className="max-w-md text-muted">{info.canDo}</p>
        <p className="mt-1 text-xs text-muted">Confianza de la estimación: {confidence}</p>
      </div>

      <div className="card p-4">
        <p>{result.summary_es}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <Stat label="Test adaptativo" value={test.level} />
          <Stat label="Escritura" value={result.writing_level} />
          <Stat label="Habla" value={result.speaking_level ?? "—"} />
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-2 font-extrabold">Resultado por habilidad</h3>
        {(Object.keys(SKILL_LABEL) as Skill[]).map((s) => {
          const v = test.profile[s];
          return (
            <div key={s} className="mb-2">
              <div className="flex justify-between text-sm font-bold">
                <span>{SKILL_LABEL[s]}</span>
                <span>{v === null ? "—" : `${Math.round(v * 100)}%`}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(v ?? 0) * 100}%` }} />
              </div>
            </div>
          );
        })}
        <p className="mt-2 text-xs text-muted">
          Los porcentajes dependen de la dificultad de las preguntas que te tocaron (el test se adapta), así
          que compáralos con cautela.
        </p>
      </div>

      {(result.strengths.length > 0 || result.weaknesses.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <List title="💪 Fortalezas" items={result.strengths} />
          <List title="🎯 Por mejorar" items={result.weaknesses} />
        </div>
      )}

      {result.writing_corrections.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-2 font-extrabold">Correcciones de tu texto</h3>
          <ul className="flex flex-col gap-3">
            {result.writing_corrections.map((c, i) => (
              <li key={i} className="text-sm">
                <span className="text-bad line-through">{c.original}</span> →{" "}
                <span className="font-bold text-good">{c.corrected}</span>
                <p className="text-muted">{c.explanation_es}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.study_plan.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-2 font-extrabold">Tu plan de 4 semanas</h3>
          <ol className="flex flex-col gap-3">
            {result.study_plan.map((w) => (
              <li key={w.week}>
                <p className="font-bold">
                  Semana {w.week}: {w.focus}
                </p>
                <ul className="list-disc pl-5 text-sm text-muted">
                  {w.activities.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}

      <button className="btn btn-primary" onClick={onStart}>
        Empezar a aprender
      </button>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg p-2">
      <p className="text-xl font-black">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 font-extrabold">{title}</h3>
      <ul className="list-disc pl-5 text-sm">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
