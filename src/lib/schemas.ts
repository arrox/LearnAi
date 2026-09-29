// Zod schemas shared by the API routes (structured outputs) and the client
// (response types). Every field is required: structured outputs are most
// reliable when the model never has to decide whether to omit something.

import { z } from "zod";

const Level = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

const VocabItem = z.object({
  term: z.string().describe("English word or phrase"),
  meaning_es: z.string().describe("Spanish meaning"),
  example: z.string().describe("Short English example sentence"),
});
export type VocabItem = z.infer<typeof VocabItem>;

export const AssessmentResult = z.object({
  level: Level.describe("Final CEFR placement, combining test and production"),
  confidence: z.enum(["low", "medium", "high"]),
  writing_level: Level.describe("CEFR level of the writing sample alone"),
  speaking_level: Level.nullable().describe("CEFR level of the speaking sample, null if none was given"),
  summary_es: z.string().describe("2-3 sentences for the learner, in Spanish"),
  strengths: z.array(z.string()).describe("In Spanish, max 4"),
  weaknesses: z.array(z.string()).describe("In Spanish, max 4"),
  focus_areas: z.array(z.string()).describe("Concrete English grammar/vocabulary targets, in Spanish, max 5"),
  writing_corrections: z.array(
    z.object({ original: z.string(), corrected: z.string(), explanation_es: z.string() }),
  ),
  study_plan: z.array(
    z.object({ week: z.number(), focus: z.string(), activities: z.array(z.string()) }),
  ).describe("4-week plan, in Spanish"),
  avatar_message: z.string().describe("Warm, short message from the tutor avatar in simple English"),
});
export type AssessmentResult = z.infer<typeof AssessmentResult>;

export const Exercise = z.object({
  type: z.enum(["multiple_choice", "fill_gap", "translate"]),
  question: z.string().describe("For fill_gap mark the gap with ___; for translate give the Spanish sentence"),
  options: z.array(z.string()).describe("4 options for multiple_choice, empty otherwise"),
  answer: z.string().describe("Correct answer text (for multiple_choice, the exact option text)"),
  explanation_es: z.string(),
});
export type Exercise = z.infer<typeof Exercise>;

export const Lesson = z.object({
  title: z.string(),
  objective_es: z.string().describe("Can-do objective in Spanish"),
  reading: z.object({
    text: z.string().describe("Comprehensible-input text slightly above the learner's level (i+1)"),
    glossary: z.array(VocabItem),
  }),
  grammar_focus: z.object({
    point: z.string(),
    explanation_es: z.string(),
    examples: z.array(z.string()),
  }),
  exercises: z.array(Exercise).describe("6-8 retrieval exercises, mixing types"),
  speaking_task: z.string().describe("A short communicative task to do with the tutor, in English"),
});
export type Lesson = z.infer<typeof Lesson>;

export const TutorTurn = z.object({
  reply: z.string().describe("The tutor's spoken reply in English, adapted to the learner's level"),
  corrections: z.array(
    z.object({
      original: z.string(),
      corrected: z.string(),
      explanation_es: z.string(),
    }),
  ).describe("Only real errors from the learner's LAST message; empty if none"),
  vocabulary: z.array(VocabItem).describe("0-2 useful new words introduced in the reply"),
  mood: z.enum(["happy", "encouraging", "thinking", "surprised"]),
});
export type TutorTurn = z.infer<typeof TutorTurn>;

export const GradeResult = z.object({
  correct: z.boolean(),
  score: z.number().describe("0 to 1"),
  feedback_es: z.string(),
  corrected: z.string().describe("Best correct version of the learner's answer"),
});
export type GradeResult = z.infer<typeof GradeResult>;
