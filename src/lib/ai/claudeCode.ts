import "server-only";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { AIError, type ChatMessage, type Effort } from "./errors";

// Default provider: the Claude Agent SDK, which drives the Claude Code CLI
// installed on this machine and authenticates with its login (`claude` ->
// /login). No API key needed. Each call spawns a short-lived CLI process with
// no tools, no settings/CLAUDE.md and no saved session: it only answers.

const MODEL = process.env.CLAUDE_CODE_MODEL || undefined; // undefined = CLI default

// Render the conversation as a transcript; the SDK takes a single prompt.
function toPrompt(messages: ChatMessage[]): string {
  if (messages.length === 1) return messages[0].content;
  const lines = messages.map((m) => `${m.role === "user" ? "LEARNER" : "TUTOR"}: ${m.content}`);
  return `Conversation so far:\n\n${lines.join("\n\n")}\n\nWrite the TUTOR's next turn, responding to the learner's last message.`;
}

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  // The CLI's validator doesn't know Zod's draft 2020-12 "$schema" URI.
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

function childEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  // An API key in the environment would take precedence over the Claude Code
  // login; drop it unless explicitly asked to keep it.
  if (process.env.CLAUDE_CODE_KEEP_API_KEY !== "1") delete env.ANTHROPIC_API_KEY;
  // Let the SDK start a fresh CLI even when this server runs inside Claude Code.
  delete env.CLAUDECODE;
  return env;
}

export async function structuredViaClaudeCode<S extends z.ZodType>(opts: {
  system: string;
  messages: ChatMessage[];
  schema: S;
  effort: Effort;
}): Promise<z.infer<S>> {
  const q = query({
    prompt: toPrompt(opts.messages),
    options: {
      systemPrompt: opts.system,
      outputFormat: { type: "json_schema", schema: jsonSchema(opts.schema) },
      tools: [],
      settingSources: [],
      persistSession: false,
      permissionMode: "dontAsk",
      // Structured output is returned through an internal tool call, which takes an extra turn.
      maxTurns: 4,
      effort: opts.effort,
      model: MODEL,
      env: childEnv(),
    },
  });

  let stderrHint = "";
  try {
    for await (const msg of q) {
      if (msg.type !== "result") continue;
      if (msg.subtype !== "success") {
        stderrHint = msg.errors.join("; ");
        throw new AIError(`Claude Code no pudo completar la respuesta (${msg.subtype}).`, 502);
      }
      const parsed = opts.schema.safeParse(msg.structured_output);
      if (!parsed.success) throw new AIError("La IA devolvió un formato inesperado.", 502);
      return parsed.data;
    }
    throw new AIError("Claude Code terminó sin respuesta.", 502);
  } catch (err) {
    if (err instanceof AIError) {
      if (stderrHint) console.error("[claude-code]", stderrHint);
      throw err;
    }
    console.error("[claude-code]", err);
    throw new AIError(
      "No pude usar Claude Code local. Revisa que esté instalado y con sesión iniciada (`claude` → /login).",
      503,
    );
  }
}
