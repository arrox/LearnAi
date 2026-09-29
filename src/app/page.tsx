"use client";

import Link from "next/link";
import Avatar from "@/components/Avatar";
import { useProfile } from "@/lib/profile";

const FEATURES = [
  { icon: "🎯", title: "Test de nivel adaptativo", text: "Se ajusta a cada respuesta (TRI/Rasch) y la IA evalúa tu escritura y tu habla según el MCER." },
  { icon: "📘", title: "Lecciones a tu medida", text: "Textos un paso por sobre tu nivel (i+1), enfocados en tus puntos débiles." },
  { icon: "💬", title: "Conversación con Lexi", text: "Habla o escribe; te responde en voz alta y corrige tus errores con reformulaciones." },
  { icon: "🧠", title: "Repaso espaciado", text: "El vocabulario nuevo vuelve justo antes de que lo olvides (algoritmo SM-2)." },
];

export default function Home() {
  const { profile, ready } = useProfile();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-4 py-10 text-center">
      <Avatar mood="happy" size={170} />
      <h1 className="mt-4 text-4xl font-black text-brand">LearnAI</h1>
      <p className="mt-2 max-w-md text-lg text-muted">
        Hola, soy <strong className="text-text">Lexi</strong>. Te ayudo a aprender inglés con métodos que
        tienen respaldo científico, no con trucos.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {ready && profile ? (
          <>
            <Link href="/dashboard" className="btn btn-primary">
              Continuar ({profile.level})
            </Link>
            <Link href="/assessment" className="btn btn-ghost">
              Repetir test de nivel
            </Link>
          </>
        ) : (
          <Link href="/assessment" className="btn btn-primary">
            Empezar test de nivel
          </Link>
        )}
      </div>

      <section className="mt-12 grid w-full gap-3 text-left sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-4">
            <div className="text-2xl" aria-hidden>
              {f.icon}
            </div>
            <h2 className="mt-1 font-extrabold">{f.title}</h2>
            <p className="text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>

      <Link href="/method" className="mt-8 text-sm font-bold text-accent underline">
        ¿En qué se basa el método?
      </Link>
    </main>
  );
}
