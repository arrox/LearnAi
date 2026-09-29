import { z } from "zod";
import { handle, structured } from "@/lib/ai";
import { estimate, skillProfile } from "@/lib/cat";
import { thetaToLevel } from "@/lib/cefr";
import { ITEM_BANK } from "@/lib/itemBank";
import { ASSESSMENT_SYSTEM } from "@/lib/prompts";
import { AssessmentResult } from "@/lib/schemas";

const Body = z.object({
  answers: z
    .array(z.object({ itemId: z.string(), choice: z.number().int() }))
    .min(1)
    .max(40),
  writing: z.string().max(3000),
  speaking: z.string().max(3000).optional(),
  goal: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = Body.parse(await req.json());

    // Score on the server so the placement never trusts client-side grading.
    const responses = body.answers.map((a) => {
      const item = ITEM_BANK.find((i) => i.id === a.itemId);
      if (!item) throw new SyntaxError(`Unknown item ${a.itemId}`);
      return { itemId: item.id, correct: item.answer === a.choice };
    });
    const { theta, se } = estimate(responses);
    const profile = skillProfile(responses);
    const testLevel = thetaToLevel(theta);

    const pct = (v: number | null) => (v === null ? "not tested" : `${Math.round(v * 100)}%`);
    const userMsg = `Adaptive test: theta=${theta.toFixed(2)}, SE=${se.toFixed(2)}, items=${responses.length}, implied level=${testLevel}.
Accuracy by skill: grammar ${pct(profile.grammar)}, vocabulary ${pct(profile.vocabulary)}, reading ${pct(profile.reading)}, listening ${pct(profile.listening)}.
Learner goal: ${body.goal || "not stated"}.

Writing task: "Describe your daily routine and one goal you have for this year (60-120 words)."
<writing_sample>
${body.writing.trim() || "(empty)"}
</writing_sample>

Speaking task: "Tell me about a place you'd like to visit and why."
<speaking_transcript>
${body.speaking?.trim() || "(not provided)"}
</speaking_transcript>`;

    const result = await structured({
      system: ASSESSMENT_SYSTEM,
      messages: [{ role: "user", content: userMsg }],
      schema: AssessmentResult,
      effort: "medium",
    });

    return { result, test: { theta, se, level: testLevel, profile } };
  });
}
