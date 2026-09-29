"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import { earn, useProfile } from "@/lib/profile";
import { dueCards, review, type Grade } from "@/lib/srs";
import { useSpeaker } from "@/lib/speech";

const GRADES: { grade: Grade; label: string; cls: string }[] = [
  { grade: 0, label: "No me acordé", cls: "btn-brand" },
  { grade: 3, label: "Difícil", cls: "btn-ghost" },
  { grade: 4, label: "Bien", cls: "btn-primary" },
  { grade: 5, label: "Fácil", cls: "btn-ghost" },
];

export default function ReviewPage() {
  const { profile, update } = useProfile();
  const { speak } = useSpeaker();
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  // Snapshot the queue when the session starts so re-queued lapses don't loop forever.
  const [queue, setQueue] = useState<string[] | null>(null);
  const [pos, setPos] = useState(0);

  const cards = useMemo(() => new Map(profile?.cards.map((c) => [c.id, c])), [profile]);
  if (!profile) return null;
  if (queue === null) {
    // Adjusting state during render (React-sanctioned) once the profile is available.
    setQueue(dueCards(profile.cards).map((c) => c.id));
    return null;
  }

  const card = cards.get(queue[pos]);

  if (!card) {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <Avatar mood={reviewed ? "happy" : "encouraging"} size={140} />
        <h1 className="text-2xl font-black">{reviewed ? "¡Repaso terminado!" : "Nada que repasar ahora"}</h1>
        <p className="max-w-sm text-muted">
          {reviewed
            ? `Repasaste ${reviewed} tarjetas. Volverán justo antes de que las olvides.`
            : profile.cards.length
              ? "Tus tarjetas aún no vencen. Vuelve mañana: repasar en el momento justo es lo que fija la memoria."
              : "Las palabras nuevas de tus lecciones y conversaciones aparecerán aquí."}
        </p>
        <Link href="/lesson" className="btn btn-primary">
          Hacer una lección
        </Link>
      </div>
    );
  }

  function grade(g: Grade) {
    update((p) =>
      earn({ ...p, cards: p.cards.map((c) => (c.id === card!.id ? review(c, g) : c)) }, 2),
    );
    setReviewed((r) => r + 1);
    setRevealed(false);
    setPos((i) => i + 1);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-extrabold text-muted uppercase">
        Repaso · {pos + 1} de {queue.length}
      </p>
      <div className="card flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted">¿Qué significa?</p>
        <button className="text-3xl font-black" onClick={() => speak(card.front, 0.85)}>
          {card.front} 🔊
        </button>
        {revealed && (
          <>
            <p className="text-xl font-bold text-accent">{card.back}</p>
            {card.example && <p className="text-muted italic">{card.example}</p>}
          </>
        )}
      </div>
      {revealed ? (
        <div className="grid grid-cols-2 gap-3">
          {GRADES.map((g) => (
            <button key={g.grade} className={`btn ${g.cls}`} onClick={() => grade(g.grade)}>
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <button className="btn btn-primary" onClick={() => setRevealed(true)}>
          Mostrar respuesta
        </button>
      )}
      <p className="text-center text-xs text-muted">
        Intenta recordar antes de mirar: el esfuerzo de recuperar es lo que consolida la memoria.
      </p>
    </div>
  );
}
