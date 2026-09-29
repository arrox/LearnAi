// Placement item bank. Each item carries a Rasch difficulty `b` (logits) that
// is an expert estimate anchored to the CEFR band centers in cefr.ts. These are
// NOT empirically calibrated values: once real response data exists, re-estimate
// them (e.g. with a Rasch/1PL fit) and replace the numbers here.

import type { CefrLevel } from "./cefr";

export type Skill = "grammar" | "vocabulary" | "reading" | "listening";

export interface Item {
  id: string;
  skill: Skill;
  level: CefrLevel;
  b: number;
  prompt: string;
  /** Short passage shown (reading) or spoken aloud via TTS (listening). */
  passage?: string;
  options: string[];
  answer: number;
}

export const SKILL_LABEL: Record<Skill, string> = {
  grammar: "Gramática",
  vocabulary: "Vocabulario",
  reading: "Lectura",
  listening: "Comprensión auditiva",
};

export const ITEM_BANK: Item[] = [
  // ---------- A1 ----------
  { id: "a1-g1", skill: "grammar", level: "A1", b: -3.0, prompt: "She ___ a teacher.", options: ["am", "is", "are", "be"], answer: 1 },
  { id: "a1-g2", skill: "grammar", level: "A1", b: -2.6, prompt: "___ you like coffee?", options: ["Does", "Is", "Do", "Are"], answer: 2 },
  { id: "a1-v1", skill: "vocabulary", level: "A1", b: -2.8, prompt: "Which one is a colour?", options: ["table", "green", "happy", "run"], answer: 1 },
  { id: "a1-v2", skill: "vocabulary", level: "A1", b: -2.4, prompt: "The opposite of \"big\" is…", options: ["tall", "small", "long", "fast"], answer: 1 },
  { id: "a1-r1", skill: "reading", level: "A1", b: -2.3, passage: "Hi! I'm Tom. I live in London with my sister. We have a cat called Max.", prompt: "Who is Max?", options: ["Tom's brother", "Tom's sister", "A cat", "A friend"], answer: 2 },
  { id: "a1-l1", skill: "listening", level: "A1", b: -2.2, passage: "Good morning. My name is Anna and I am twenty-five years old.", prompt: "How old is Anna?", options: ["15", "25", "35", "52"], answer: 1 },

  // ---------- A2 ----------
  { id: "a2-g1", skill: "grammar", level: "A2", b: -1.9, prompt: "Yesterday I ___ to the cinema with my friends.", options: ["go", "goes", "went", "going"], answer: 2 },
  { id: "a2-g2", skill: "grammar", level: "A2", b: -1.6, prompt: "This book is ___ than the other one.", options: ["more interesting", "interestinger", "most interesting", "more interestinger"], answer: 0 },
  { id: "a2-g3", skill: "grammar", level: "A2", b: -1.3, prompt: "I ___ TV when you called me.", options: ["watched", "was watching", "am watching", "watch"], answer: 1 },
  { id: "a2-v1", skill: "vocabulary", level: "A2", b: -1.7, prompt: "You buy medicine at the…", options: ["bakery", "pharmacy", "library", "garage"], answer: 1 },
  { id: "a2-r1", skill: "reading", level: "A2", b: -1.4, passage: "The museum is open from Tuesday to Sunday, 10 am to 6 pm. Entry is free on the first Sunday of every month.", prompt: "When can you visit for free?", options: ["Every Monday", "Every Sunday", "The first Sunday of the month", "Tuesday mornings"], answer: 2 },
  { id: "a2-l1", skill: "listening", level: "A2", b: -1.5, passage: "Sorry, the train to Manchester is delayed. It will now leave at quarter past four from platform six.", prompt: "What time does the train leave now?", options: ["4:00", "4:15", "4:45", "6:15"], answer: 1 },

  // ---------- B1 ----------
  { id: "b1-g1", skill: "grammar", level: "B1", b: -0.9, prompt: "I ___ in this city since 2019.", options: ["live", "am living", "have lived", "lived"], answer: 2 },
  { id: "b1-g2", skill: "grammar", level: "B1", b: -0.6, prompt: "If it rains tomorrow, we ___ the picnic.", options: ["cancel", "will cancel", "would cancel", "cancelled"], answer: 1 },
  { id: "b1-g3", skill: "grammar", level: "B1", b: -0.3, prompt: "The bridge ___ in 1890.", options: ["built", "was built", "has built", "is building"], answer: 1 },
  { id: "b1-v1", skill: "vocabulary", level: "B1", b: -0.7, prompt: "Please ___ the form and send it back by Friday.", options: ["fill in", "fill up", "fill out of", "fill on"], answer: 0 },
  { id: "b1-r1", skill: "reading", level: "B1", b: -0.4, passage: "Although the new app promised to save users time, many complained that its constant notifications were more distracting than helpful. The company has since added an option to turn them off.", prompt: "What was the main complaint?", options: ["The app was too expensive", "The app was too slow", "The notifications were distracting", "There was no way to save time"], answer: 2 },
  { id: "b1-l1", skill: "listening", level: "B1", b: -0.5, passage: "I was going to take the bus, but it was so crowded that I decided to walk instead. In the end I arrived earlier than expected.", prompt: "Why did the speaker walk?", options: ["The bus was late", "The bus was full", "Walking is healthier", "There was no bus"], answer: 1 },

  // ---------- B2 ----------
  { id: "b2-g1", skill: "grammar", level: "B2", b: 0.3, prompt: "If I ___ about the traffic, I would have left earlier.", options: ["knew", "had known", "would know", "have known"], answer: 1 },
  { id: "b2-g2", skill: "grammar", level: "B2", b: 0.6, prompt: "She suggested ___ a taxi to the airport.", options: ["to take", "taking", "take", "that taking"], answer: 1 },
  { id: "b2-g3", skill: "grammar", level: "B2", b: 0.8, prompt: "By the time we arrived, the concert ___.", options: ["already started", "has already started", "had already started", "was already starting"], answer: 2 },
  { id: "b2-v1", skill: "vocabulary", level: "B2", b: 0.5, prompt: "The negotiations reached a ___: neither side would compromise.", options: ["deadline", "deadlock", "headline", "landmark"], answer: 1 },
  { id: "b2-r1", skill: "reading", level: "B2", b: 0.7, passage: "Critics argue that remote work erodes company culture, yet surveys suggest that employees who work from home report higher job satisfaction without measurable drops in productivity.", prompt: "What does the text imply?", options: ["Remote work lowers productivity", "The critics' concern is not clearly supported by the survey data", "Company culture has improved", "Employees prefer the office"], answer: 1 },
  { id: "b2-l1", skill: "listening", level: "B2", b: 0.6, passage: "To be honest, I wasn't particularly keen on the proposal at first, but once they explained the long-term savings, I came round to the idea.", prompt: "How did the speaker's opinion change?", options: ["From positive to negative", "It didn't change", "From reluctant to supportive", "From confused to angry"], answer: 2 },

  // ---------- C1 ----------
  { id: "c1-g1", skill: "grammar", level: "C1", b: 1.3, prompt: "Not only ___ the deadline, but he also exceeded the budget.", options: ["he missed", "did he miss", "he did miss", "missed he"], answer: 1 },
  { id: "c1-g2", skill: "grammar", level: "C1", b: 1.6, prompt: "___ the circumstances, the team performed remarkably well.", options: ["Despite of", "Given", "Although", "In spite"], answer: 1 },
  { id: "c1-v1", skill: "vocabulary", level: "C1", b: 1.4, prompt: "His explanation was so ___ that nobody could follow it.", options: ["lucid", "convoluted", "concise", "candid"], answer: 1 },
  { id: "c1-v2", skill: "vocabulary", level: "C1", b: 1.7, prompt: "The minister tried to ___ the impact of the scandal.", options: ["play down", "play up", "play out", "play off"], answer: 0 },
  { id: "c1-r1", skill: "reading", level: "C1", b: 1.5, passage: "The report stops short of recommending an outright ban, instead advocating a phased approach that would give manufacturers time to adapt while still signalling the direction of future regulation.", prompt: "What is the report's position?", options: ["It calls for an immediate ban", "It rejects any regulation", "It favours gradual change over an immediate ban", "It leaves the decision to manufacturers alone"], answer: 2 },
  { id: "c1-l1", skill: "listening", level: "C1", b: 1.6, passage: "Frankly, the figures speak for themselves; whatever spin the board puts on it, this quarter was a washout.", prompt: "What does the speaker think about the quarter?", options: ["It was very successful", "It was a failure", "It is too early to judge", "The board is being too negative"], answer: 1 },

  // ---------- C2 ----------
  { id: "c2-g1", skill: "grammar", level: "C2", b: 2.3, prompt: "Were the committee ___ the proposal, it would set a significant precedent.", options: ["approving", "to approve", "approved", "have approved"], answer: 1 },
  { id: "c2-g2", skill: "grammar", level: "C2", b: 2.6, prompt: "Little ___ that the decision would haunt them for years.", options: ["they realised", "did they realise", "they did realise", "realised they"], answer: 1 },
  { id: "c2-v1", skill: "vocabulary", level: "C2", b: 2.4, prompt: "Her ___ remarks offended nearly everyone at the table.", options: ["sagacious", "tactless", "laconic", "ebullient"], answer: 1 },
  { id: "c2-v2", skill: "vocabulary", level: "C2", b: 2.8, prompt: "The evidence was merely ___; it hinted at guilt but proved nothing.", options: ["circumstantial", "conclusive", "corroborated", "incontrovertible"], answer: 0 },
  { id: "c2-r1", skill: "reading", level: "C2", b: 2.5, passage: "To dismiss the novel as mere pastiche is to overlook the subtlety with which it interrogates the very conventions it appears to reproduce.", prompt: "What is the writer's view of the novel?", options: ["It is an unoriginal copy", "It critically examines the conventions it imitates", "It ignores literary conventions", "It is too subtle to be understood"], answer: 1 },
  { id: "c2-l1", skill: "listening", level: "C2", b: 2.6, passage: "I'd hardly call it a resounding endorsement; it was, at best, a grudging acknowledgement that the alternatives were even less palatable.", prompt: "How strong was the support described?", options: ["Enthusiastic", "Reluctant", "Unanimous", "Non-existent"], answer: 1 },
];
