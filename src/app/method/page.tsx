import Link from "next/link";

export const metadata = { title: "El método — LearnAI" };

const PRINCIPLES = [
  {
    title: "Niveles MCER (Marco Común Europeo)",
    where: "Test de nivel, lecciones, tutor",
    text: "Todo se organiza en los niveles A1–C2 y sus descriptores de “puedo hacer”, el estándar internacional para medir dominio de idiomas.",
    refs: "Council of Europe (2020). CEFR Companion Volume.",
  },
  {
    title: "Test adaptativo con Teoría de Respuesta al Ítem",
    where: "Test de nivel",
    text: "Cada pregunta se elige según tus respuestas anteriores (modelo de Rasch), así se llega a una estimación precisa con menos preguntas. La IA suma la evaluación de tu escritura y tu habla, que un test de opción múltiple no mide.",
    refs: "Rasch (1960); Wainer et al. (2000). Computerized Adaptive Testing: A Primer.",
  },
  {
    title: "Práctica de recuperación (efecto test)",
    where: "Ejercicios, repaso",
    text: "Intentar recordar fortalece la memoria mucho más que releer. Por eso las lecciones terminan en ejercicios de producción y no en resúmenes.",
    refs: "Roediger & Karpicke (2006), Psychological Science; Dunlosky et al. (2013).",
  },
  {
    title: "Repetición espaciada",
    where: "Repaso",
    text: "El vocabulario vuelve en intervalos crecientes, justo antes de olvidarlo (algoritmo SM-2). Es una de las técnicas de aprendizaje con evidencia más sólida.",
    refs: "Cepeda et al. (2006), Psychological Bulletin; Wozniak (1990), SM-2.",
  },
  {
    title: "Input comprensible (i+1)",
    where: "Lecturas",
    text: "Los textos se escriben apenas por sobre tu nivel: entiendes casi todo y aprendes lo nuevo por contexto.",
    refs: "Krashen (1982). Influyente, aunque su versión fuerte es debatida: por eso lo combinamos con práctica explícita.",
  },
  {
    title: "Interacción y producción",
    where: "Conversación",
    text: "Se aprende negociando significado y teniendo que producir el idioma, no solo escuchándolo. Lexi te hace hablar y te repregunta.",
    refs: "Long (1996), Interaction Hypothesis; Swain (1995), Output Hypothesis.",
  },
  {
    title: "Retroalimentación correctiva",
    where: "Conversación, escritura",
    text: "Lexi reformula tus errores de forma natural (recasts) y además te muestra la corrección explícita con una explicación breve: la combinación con mejor evidencia.",
    refs: "Lyster & Ranta (1997); Li (2010), meta-análisis en Language Learning; Lyster & Saito (2010).",
  },
  {
    title: "Aprendizaje basado en tareas",
    where: "Juegos de rol, tareas orales",
    text: "Practicas situaciones reales (pedir en un café, una entrevista) donde el idioma es un medio para lograr algo.",
    refs: "Ellis (2003). Task-based Language Learning and Teaching.",
  },
];

export default function MethodPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-accent">
        ← Volver
      </Link>
      <h1 className="mt-3 text-3xl font-black">El método detrás de LearnAI</h1>
      <p className="mt-2 text-muted">
        Cada función de la app corresponde a un principio con respaldo en investigación sobre adquisición de
        segundas lenguas y psicología cognitiva.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {PRINCIPLES.map((p) => (
          <li key={p.title} className="card p-4">
            <p className="text-xs font-extrabold text-accent uppercase">{p.where}</p>
            <h2 className="font-extrabold">{p.title}</h2>
            <p className="mt-1 text-sm">{p.text}</p>
            <p className="mt-2 text-xs text-muted">{p.refs}</p>
          </li>
        ))}
      </ul>

      <section className="card mt-6 p-4 text-sm">
        <h2 className="font-extrabold">Lo que hay que saber</h2>
        <ul className="mt-2 list-disc pl-5 text-muted">
          <li>
            El test de nivel es una estimación para ubicarte, no una certificación. Las dificultades de las
            preguntas son estimaciones de expertos y se deben recalibrar con datos reales de uso.
          </li>
          <li>
            Rachas y puntos ayudan a la constancia, pero su efecto medido en el aprendizaje es pequeño (Sailer
            & Homner, 2020). Lo que más importa es practicar a diario con recuperación y repaso espaciado.
          </li>
          <li>La IA puede equivocarse al corregir; si algo no te convence, consúltalo.</li>
        </ul>
      </section>
    </main>
  );
}
