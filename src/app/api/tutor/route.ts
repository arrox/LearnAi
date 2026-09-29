import { z } from "zod";
import { handle, structured } from "@/lib/ai";
import { TUTOR_SYSTEM } from "@/lib/prompts";
import { TutorTurn } from "@/lib/schemas";

const Body = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  scenario: z.string().max(300).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(60),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = Body.parse(await req.json());
    // Keep the most recent turns only; the first sent turn must be the learner's.
    let history = body.messages.slice(-30);
    while (history.length && history[0].role !== "user") history = history.slice(1);
    if (!history.length || history[history.length - 1].role !== "user") {
      throw new SyntaxError("Last message must come from the learner");
    }

    const context = `[Session context] Learner CEFR level: ${body.level}. Scenario: ${
      body.scenario || "free conversation"
    }.`;
    const [first, ...rest] = history;
    return structured({
      system: TUTOR_SYSTEM,
      messages: [{ role: "user", content: `${context}\n\n${first.content}` }, ...rest],
      schema: TutorTurn,
      effort: "low",
      maxTokens: 4000,
    });
  });
}
