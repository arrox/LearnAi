# LearnAI — tutora de inglés con IA

App web para aprender inglés con **Lexi**, una tutora-avatar (un zorro animado con voz). Parte con un **test de nivel adaptativo** alineado al MCER y después arma práctica diaria personalizada con IA (Claude).

## Qué hace

| Módulo | Qué hace | Base científica |
|---|---|---|
| **Test de nivel** (`/assessment`) | 12–18 preguntas adaptativas (gramática, vocabulario, lectura, audio) + escritura + respuesta hablada opcional. La IA combina todo en un nivel A1–C2, con fortalezas, debilidades, correcciones y plan de 4 semanas. | MCER; Teoría de Respuesta al Ítem (Rasch) con test adaptativo (CAT) |
| **Lecciones** (`/lesson`) | Lectura generada a nivel i+1, glosario, foco gramatical según tus debilidades y 6–8 ejercicios de recuperación. Las respuestas libres las corrige la IA. | Input comprensible; práctica de recuperación |
| **Conversación** (`/chat`) | Chat por voz o texto con Lexi, libre o en juegos de rol (café, aeropuerto, entrevista…). Responde en voz alta, reformula tus errores y muestra la corrección explícita. | Hipótesis de interacción y de output; retroalimentación correctiva (recasts + metalingüística); enfoque por tareas |
| **Repaso** (`/review`) | Tarjetas con el vocabulario nuevo de lecciones y conversaciones, programadas con SM-2. | Repetición espaciada |

Los fundamentos y referencias están en la página `/method` de la app.

## Arquitectura

- **Next.js 16 (App Router) + TypeScript + Tailwind 4.**
- **IA:** `@anthropic-ai/sdk`, modelo `claude-opus-5-5` por defecto, con *structured outputs* (esquemas Zod en `src/lib/schemas.ts`), caché del system prompt y *fallback* del lado del servidor ante rechazos.
- **Rutas API** (`src/app/api/*`): `assessment`, `lesson`, `tutor`, `grade`. La API key vive solo en el servidor. El test se vuelve a puntuar en el servidor: el cliente no decide su propio nivel.
- **Motor adaptativo** (`src/lib/cat.ts`): estimación EAP bajo Rasch, selección por máxima información con balance de habilidades.
- **Voz:** Web Speech API del navegador (síntesis para Lexi; reconocimiento en Chrome/Edge/Safari).
- **Datos:** perfil y progreso en `localStorage` (sin cuentas por ahora).

## Correr en local

```bash
cp .env.example .env.local   # y pega tu ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Sin API key, el test objetivo funciona igual y ofrece “usar solo el resultado del test”; lecciones, conversación y evaluación de escritura necesitan la IA.

## Limitaciones conocidas

- **Calibración del test:** las dificultades de los 36 ítems (`src/lib/itemBank.ts`) son estimaciones de experto, no parámetros calibrados con datos. En simulación (suponiendo que el modelo es correcto) el test solo acierta el nivel exacto ~70% de las veces y queda a ±1 nivel ~100%; la evaluación de escritura/habla complementa eso. Para producción hace falta un banco más grande y recalibrar con respuestas reales.
- **Sin cuentas ni backend de datos:** el progreso no se sincroniza entre dispositivos.
- **Sin límite de uso** en las rutas API: antes de publicar, agrega autenticación y *rate limiting* para controlar el costo.
- El reconocimiento de voz no está disponible en Firefox.
