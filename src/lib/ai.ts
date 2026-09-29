import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

// Server-side refusal fallback ("default" routes by refusal category). Only
// sent for models that accept the parameter.
const FALLBACK_MODELS = new Set([
  "claude-fable-5-1",
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
]);

export class AIError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

type Effort = "low" | "medium" | "high";

export async function structured<S extends z.ZodType>(opts: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema: S;
  effort: Effort;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  const useFallbacks = FALLBACK_MODELS.has(MODEL);
  try {
    const res = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      // The system prompt is stable per route, so cache it.
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: opts.messages,
      output_config: { effort: opts.effort, format: betaZodOutputFormat(opts.schema) },
      ...(useFallbacks
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });

    if (res.stop_reason === "refusal") {
      throw new AIError("El tutor no pudo responder a esta solicitud.", 422);
    }
    if (res.stop_reason === "max_tokens") {
      throw new AIError("La respuesta de la IA quedó incompleta. Intenta de nuevo.", 502);
    }
    if (!res.parsed_output) {
      throw new AIError("La IA devolvió un formato inesperado.", 502);
    }
    return res.parsed_output as z.infer<S>;
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      throw new AIError("Falta o es inválida la ANTHROPIC_API_KEY del servidor.", 500);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new AIError("Demasiadas solicitudes. Espera unos segundos.", 429);
    }
    if (err instanceof Anthropic.BadRequestError) {
      throw new AIError(`Solicitud inválida a la IA: ${err.message}`, 400);
    }
    if (err instanceof Anthropic.APIError) {
      throw new AIError(`Error del servicio de IA (${err.status ?? "red"}).`, 502);
    }
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      // Most likely the SDK found no credentials at all.
      console.error(err);
      throw new AIError("La IA no está configurada en el servidor (falta ANTHROPIC_API_KEY).", 503);
    }
    throw err;
  }
}

/** Wraps a route handler body so AIError / validation failures become JSON errors. */
export async function handle(fn: () => Promise<unknown>): Promise<Response> {
  try {
    return Response.json(await fn());
  } catch (err) {
    if (err instanceof AIError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof SyntaxError || (err as { name?: string })?.name === "ZodError") {
      return Response.json({ error: "Solicitud mal formada." }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Error interno." }, { status: 500 });
  }
}
