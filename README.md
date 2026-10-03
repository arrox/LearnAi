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
- **IA, dos backends** (`src/lib/ai.ts`, elegido con `AI_PROVIDER`):
  - `claude-code` (por defecto): **Claude Agent SDK**, que usa el Claude Code instalado en tu máquina y su sesión (`claude auth login`). No necesita API key. Cada llamada levanta un proceso de Claude Code sin herramientas, sin configuración ni CLAUDE.md, y sin guardar la sesión.
  - `api`: `@anthropic-ai/sdk` con `ANTHROPIC_API_KEY` (modelo `claude-opus-5-5`, caché del system prompt y *fallback* ante rechazos). Es la opción para publicar la app.
  - En ambos casos las respuestas son JSON validado contra los esquemas Zod de `src/lib/schemas.ts`.
- **Rutas API** (`src/app/api/*`): `assessment`, `lesson`, `tutor`, `grade`. La API key vive solo en el servidor. El test se vuelve a puntuar en el servidor: el cliente no decide su propio nivel.
- **Motor adaptativo** (`src/lib/cat.ts`): estimación EAP bajo Rasch, selección por máxima información con balance de habilidades.
- **Voz:** Web Speech API del navegador (síntesis para Lexi; reconocimiento en Chrome/Edge/Safari).
- **Datos:** perfil y progreso en `localStorage` (sin cuentas por ahora).

## Ambiente de desarrollo local

Requisitos: Node 20+ y [Claude Code](https://code.claude.com) con sesión iniciada.

```bash
git clone https://github.com/arrox/LearnAi.git
cd LearnAi
git checkout claude/english-tutor-ai-app-xh1qmu
npm install -g @anthropic-ai/claude-code   # si aún no lo tienes
claude auth login                          # una vez
npm run setup    # instala dependencias, crea .env.local y verifica tu login de Claude Code
npm run dev      # http://localhost:3000
```

Con `AI_PROVIDER=claude-code` la app **ignora `ANTHROPIC_API_KEY`** aunque la tengas en el entorno, para que se use tu login de Claude Code (si quieres mantenerla, `CLAUDE_CODE_KEEP_API_KEY=1`).

Tiempos medidos con Claude Code local: corregir una respuesta o un turno de conversación tarda ~3–4 s; la evaluación de nivel ~15 s; generar una lección ~25 s.

Si la IA no está disponible, el test objetivo funciona igual y ofrece “usar solo el resultado del test”.

## Desplegar en Windows (Claude Code local)

Deja LearnAI corriendo en tu PC en `http://localhost:3000`, en segundo plano y con inicio automático al entrar a Windows. Usa tu sesión de Claude Code a través del Claude Agent SDK.

Requisitos: Node 20+ (`winget install OpenJS.NodeJS.LTS`) y Git. Si falta Claude Code, el script lo instala y te pide iniciar sesión.

```powershell
cd $HOME
git clone https://github.com/arrox/LearnAi.git
cd LearnAi
git checkout claude/english-tutor-ai-app-xh1qmu
powershell -ExecutionPolicy Bypass -File scripts\windows\deploy.ps1
```

El script verifica requisitos, detiene la versión anterior, hace `git pull`, instala, compila, arranca el servidor, registra el inicio automático y termina con una llamada real a la IA para confirmar que Claude Code responde.

| Acción | Comando |
|---|---|
| Actualizar a la última versión | `powershell -ExecutionPolicy Bypass -File scripts\windows\deploy.ps1` |
| Detener | `powershell -ExecutionPolicy Bypass -File scripts\windows\stop.ps1` |
| Iniciar sin recompilar | `powershell -ExecutionPolicy Bypass -File scripts\windows\start.ps1` |
| Quitar el inicio automático | `powershell -ExecutionPolicy Bypass -File scripts\windows\stop.ps1 -RemoveAutostart` |
| Otro puerto | agrega `-Port 3005` a cualquiera de los anteriores |

Los registros quedan en `logs\server.log` y `logs\server-error.log`.

El servidor escucha solo en `127.0.0.1`: la app no tiene login y gasta tu cuenta de Claude Code, así que no queda expuesta a la red.

## Limitaciones conocidas

- **Calibración del test:** las dificultades de los 36 ítems (`src/lib/itemBank.ts`) son estimaciones de experto, no parámetros calibrados con datos. En simulación (suponiendo que el modelo es correcto) el test solo acierta el nivel exacto ~70% de las veces y queda a ±1 nivel ~100%; la evaluación de escritura/habla complementa eso. Para producción hace falta un banco más grande y recalibrar con respuestas reales.
- **Sin cuentas ni backend de datos:** el progreso no se sincroniza entre dispositivos.
- **El backend `claude-code` es solo para uso local y personal.** Usa tu cuenta y tus límites de Claude Code; para que otras personas usen la app, cambia a `AI_PROVIDER=api` con una API key.
- **Sin límite de uso** en las rutas API: antes de publicar, agrega autenticación y *rate limiting* para controlar el costo.
- El reconocimiento de voz no está disponible en Firefox.
