"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { currentStreak, useProfile } from "@/lib/profile";
import { dueCards } from "@/lib/srs";

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/lesson", label: "Lección", icon: "📘" },
  { href: "/chat", label: "Conversar", icon: "💬" },
  { href: "/review", label: "Repaso", icon: "🧠" },
];

/** Layout for the learning area; sends learners without a profile to the placement test. */
export default function AppShell({ children }: { children: ReactNode }) {
  const { profile, ready } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !profile) router.replace("/assessment");
  }, [ready, profile, router]);

  if (!profile) {
    return <div className="grid min-h-screen place-items-center text-muted">Cargando…</div>;
  }

  const due = dueCards(profile.cards).length;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b-2 border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="text-xl font-black text-brand">
          LearnAI
        </Link>
        <div className="flex items-center gap-3 text-sm font-extrabold">
          <span title="Nivel MCER" className="rounded-lg bg-accent px-2 py-1 text-white">
            {profile.level}
          </span>
          <span title="Racha de días">🔥 {currentStreak(profile)}</span>
          <span title="Experiencia">⭐ {profile.xp}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-line bg-surface">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-extrabold ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {n.icon}
                  </span>
                  {n.label}
                  {n.href === "/review" && due > 0 && (
                    <span className="absolute top-1 right-[calc(50%-24px)] rounded-full bg-bad px-1.5 text-[10px] text-white">
                      {due}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
