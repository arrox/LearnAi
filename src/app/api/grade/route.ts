import { z } from "zod";
import { handle, structured } from "@/lib/ai";
import { GRADE_SYSTEM } from "@/lib/prompts";
import { GradeResult } from "@/lib/schemas";

const Body = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  question: z.string().max(500),
  expected: z.string().max(500),
  answer: z.string().max(500),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = Body.parse(await req.json());
    return structured({
      system: GRADE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Learner level: ${body.level}
Exercise: ${body.question}
Reference answer: ${body.expected}
Learner answer: ${body.answer}`,
        },
      ],
      schema: GradeResult,
      effort: "low",
      maxTokens: 2000,
    });
  });
}
