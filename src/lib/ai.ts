import "server-only";
import type { z } from "zod";
import { structuredViaApi } from "./ai/anthropicApi";
import { structuredViaClaudeCode } from "./ai/claudeCode";
import { AIError, type ChatMessage, type Effort } from "./ai/errors";

export { AIError };

// "claude-code" (default): local Claude Code login via the Agent SDK.
// "api": Claude API with ANTHROPIC_API_KEY (use this for a deployed app).
const PROVIDER = process.env.AI_PROVIDER === "api" ? "api" : "claude-code";

export async function structured<S extends z.ZodType>(opts: {
  system: string;
  messages: ChatMessage[];
  schema: S;
  effort: Effort;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  return PROVIDER === "api" ? structuredViaApi(opts) : structuredViaClaudeCode(opts);
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
