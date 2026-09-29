"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TutorBubble from "@/components/TutorBubble";
import { LEVEL_INFO } from "@/lib/cefr";
import { saveProfile, useProfile } from "@/lib/profile";
import { useSpeaker } from "@/lib/speech";
import { dueCards } from "@/lib/srs";

export default function Dashboard() {
  const { profile } = useProfile();
  const { speak, speaking } = useSpeaker();
  const router = useRouter();
  const [now] = useState(() => Date.now());
  if (!profile) return null;

  const due = dueCards(profile.cards, now).length;
  const week = Math.min(
    profile.assessment.study_plan.length,
    Math.floor((now - profile.assessedAt) / (7 * 86400000)) + 1,
  );
  const plan = profile.assessment.study_plan.find((w) => w.week === week);
  const greeting = `Hi${profile.name ? ` ${profile.name}` : ""}! ${
    due > 0 ? `You have ${due} words to review today.` : "Ready for today's practice?"
  }`;

  const tasks = [
    {
      href: "/review",
      icon: "🧠",
      title: "Repaso espaciado",
      text: due > 0 ? `${due} tarjetas pendientes` : "Nada pendiente por hoy",
      done: due === 0,
    },
    {
      href: "/lesson",
      icon: "📘",
      title: "Lección del día",
      text: "Lectura i+1, gramática y ejercicios de recuerdo",
      done: false,
    },
    {
      href: "/chat",
      icon: "💬",
      title: "Conversación con Lexi",
      text: "10 minutos hablando con corrección",
      done: false,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <TutorBubble
        mood="happy"
        talking={speaking}
        text={greeting}
        onSpeak={() => speak(greeting)}
      />

      <section>
        <h2 className="mb-2 text-lg font-black">Tu práctica de hoy</h2>
        <div className="flex flex-col gap-3">
          {tasks.map((t) => (
            <Link key={t.href} href={t.href} className="card flex items-center gap-4 p-4 hover:border-accent">
              <span className="text-3xl" aria-hidden>
                {t.icon}
              </span>
              <div className="flex-1">
                <p className="font-extrabold">{t.title}</p>
                <p className="text-sm text-muted">{t.text}</p>
              </div>
              <span className="text-xl" aria-hidden>
                {t.done ? "✅" : "›"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        <Stat value={profile.level} label={LEVEL_INFO[profile.level].name} />
        <Stat value={String(profile.lessonsDone)} label="Lecciones" />
        <Stat value={String(profile.cards.length)} label="Palabras" />
      </section>

      {plan && (
        <section className="card p-4">
          <h2 className="font-black">
            Semana {plan.week} de tu plan: {plan.focus}
          </h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted">
            {plan.activities.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {profile.weakPoints.length > 0 && (
        <section className="card p-4">
          <h2 className="font-black">Puntos a reforzar</h2>
          <p className="mb-2 text-xs text-muted">
            Salen de tu evaluación de nivel; las lecciones los priorizan.
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.weakPoints.map((w) => (
              <span key={w} className="rounded-lg bg-bg px-2 py-1 text-sm font-semibold">
                {w}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-wrap gap-3 text-sm">
        <Link href="/assessment" className="btn btn-ghost">
          Repetir test de nivel
        </Link>
        <Link href="/method" className="btn btn-ghost">
          El método
        </Link>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (confirm("¿Borrar todo tu progreso de este dispositivo?")) {
              saveProfile(null);
              router.replace("/");
            }
          }}
        >
          Borrar progreso
        </button>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-3">
      <p className="text-2xl font-black text-accent">{value}</p>
      <p className="text-xs font-bold text-muted">{label}</p>
    </div>
  );
}
