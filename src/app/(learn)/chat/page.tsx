"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Avatar, { type Mood } from "@/components/Avatar";
import { postJSON } from "@/lib/api";
import { addCards, earn, useProfile } from "@/lib/profile";
import type { TutorTurn } from "@/lib/schemas";
import { useListener, useSpeaker } from "@/lib/speech";

interface Msg {
  role: "user" | "assistant";
  content: string;
  corrections?: TutorTurn["corrections"];
  vocabulary?: TutorTurn["vocabulary"];
}

const SCENARIOS = [
  { label: "Charla libre", value: "" },
  { label: "☕ Pedir en una cafetería", value: "The learner is ordering at a coffee shop; you are the barista." },
  { label: "✈️ Check-in en el aeropuerto", value: "The learner is checking in for a flight; you are the airline agent." },
  { label: "💼 Entrevista de trabajo", value: "Job interview; you are a friendly interviewer asking typical questions." },
  { label: "🏨 Problema en el hotel", value: "The learner calls hotel reception about a problem with the room; you are the receptionist." },
  { label: "🩺 En el médico", value: "The learner describes symptoms to a doctor; you are the doctor." },
];

export default function ChatPage() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}

function Chat() {
  const params = useSearchParams();
  const { profile, update } = useProfile();
  const { speak, stop, speaking } = useSpeaker();
  const [scenario, setScenario] = useState(params.get("scenario") ?? "");
  const [started, setStarted] = useState(!!params.get("scenario"));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<Mood>("happy");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [error, setError] = useState("");
  const counted = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);
  const listener = useListener((t) => send(t));

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  if (!profile) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !profile) return;
    setInput("");
    setError("");
    stop();
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages(history);
    setBusy(true);
    setMood("thinking");
    try {
      const turn = await postJSON<TutorTurn>("/api/tutor", {
        level: profile.level,
        scenario: scenario || undefined,
        messages: history.map(({ role, content }) => ({ role, content })),
      });
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { ...copy[copy.length - 1], corrections: turn.corrections };
        return [...copy, { role: "assistant", content: turn.reply, vocabulary: turn.vocabulary }];
      });
      setMood(turn.mood);
      if (autoSpeak) speak(turn.reply);
      update((p) => {
        let next = earn(addCards(p, turn.vocabulary), turn.corrections.length === 0 ? 3 : 2);
        if (!counted.current) {
          counted.current = true;
          next = { ...next, conversations: next.conversations + 1 };
        }
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
      setMood("sad");
      // Drop the unanswered message so the learner can retry it.
      setMessages((m) => m.slice(0, -1));
      setInput(content);
    } finally {
      setBusy(false);
    }
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center text-center">
          <Avatar mood="happy" size={130} />
          <h1 className="text-2xl font-black">Conversa con Lexi</h1>
          <p className="text-muted">
            Habla o escribe en inglés. Lexi te responde en voz alta, adaptada a tu nivel {profile.level}, y
            te muestra tus errores.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.label}
              className="option"
              onClick={() => {
                setScenario(s.value);
                setStarted(true);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const opener =
    scenario && !messages.length
      ? "Say hello to start the role-play!"
      : !messages.length
        ? "Hi! What would you like to talk about today?"
        : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-[60px] z-[5] -mx-4 flex items-center gap-3 border-b-2 border-line bg-bg/95 px-4 py-2 backdrop-blur">
        <Avatar mood={busy ? "thinking" : mood} talking={speaking} size={72} />
        <div className="flex-1 text-sm">
          <p className="font-extrabold">Lexi</p>
          <p className="line-clamp-2 text-muted">{scenario || "Charla libre"}</p>
        </div>
        <label className="flex items-center gap-1 text-xs font-bold text-muted">
          <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} />
          Voz
        </label>
      </div>

      {opener && <p className="text-center text-sm text-muted">{opener}</p>}

      <ul className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <li key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === "user" ? "bg-accent text-white" : "card"
              }`}
            >
              {m.content}
              {m.role === "assistant" && (
                <button className="ml-2 text-sm" onClick={() => speak(m.content)} aria-label="Escuchar">
                  🔊
                </button>
              )}
            </div>
            {m.corrections && m.corrections.length > 0 && (
              <div className="mt-1 max-w-[85%] rounded-xl bg-bad-bg px-3 py-2 text-sm">
                {m.corrections.map((c, j) => (
                  <p key={j} className="mb-1">
                    <span className="line-through opacity-70">{c.original}</span> →{" "}
                    <strong className="text-good">{c.corrected}</strong>
                    <br />
                    <span className="text-muted">{c.explanation_es}</span>
                  </p>
                ))}
              </div>
            )}
            {m.vocabulary && m.vocabulary.length > 0 && (
              <p className="mt-1 text-xs text-muted">
                📌 Nuevo: {m.vocabulary.map((v) => `${v.term} (${v.meaning_es})`).join(", ")}
              </p>
            )}
          </li>
        ))}
        {busy && <li className="text-sm text-muted">Lexi está escribiendo…</li>}
      </ul>
      {error && <p className="text-sm text-bad">{error}</p>}
      <div ref={bottom} className="h-16" />

      <form
        className="fixed inset-x-0 bottom-[62px] z-10 mx-auto flex max-w-3xl gap-2 border-t-2 border-line bg-bg px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        {listener.supported && (
          <button
            type="button"
            className={`btn ${listener.listening ? "btn-brand" : "btn-ghost"} !px-4`}
            onClick={listener.listening ? listener.stop : listener.start}
            aria-label={listener.listening ? "Detener grabación" : "Hablar"}
            disabled={busy}
          >
            {listener.listening ? "⏹" : "🎙"}
          </button>
        )}
        <input
          value={listener.listening ? listener.interim : input}
          onChange={(e) => setInput(e.target.value)}
          readOnly={listener.listening}
          maxLength={2000}
          className="min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-4"
          placeholder={listener.listening ? "Escuchando…" : "Escribe en inglés…"}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary !px-4" disabled={busy || !input.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}
