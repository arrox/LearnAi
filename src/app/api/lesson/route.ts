import { z } from "zod";
import { handle, structured } from "@/lib/ai";
import { LESSON_SYSTEM } from "@/lib/prompts";
import { Lesson } from "@/lib/schemas";

const Body = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  topic: z.string().max(120).optional(),
  weakPoints: z.array(z.string().max(200)).max(10).default([]),
  goal: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = Body.parse(await req.json());
    const userMsg = `Learner level: ${body.level}
Learner goal: ${body.goal || "general English"}
Requested topic: ${body.topic || "choose an engaging everyday topic"}
Known weak points: ${body.weakPoints.length ? body.weakPoints.join("; ") : "none recorded yet"}`;

    return structured({
      system: LESSON_SYSTEM,
      messages: [{ role: "user", content: userMsg }],
      schema: Lesson,
      effort: "medium",
    });
  });
}
