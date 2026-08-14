import type { Mood } from "@/domain/news/mood";

export type MoodDefinition = {
  id: Mood;
  label: string;
  shortLabel: string;
  description: string;
  promptInstruction: string;
};

export const moodDefinitions: readonly MoodDefinition[] = [
  {
    id: "neutral",
    label: "Neutral",
    shortLabel: "Neutral",
    description: "Direct, restrained and information-first.",
    promptInstruction: "Use calm, plain newsroom language. Remove emotional colouring without removing information.",
  },
  {
    id: "hopeful",
    label: "Hopeful",
    shortLabel: "Hopeful",
    description: "Constructive framing without inventing a positive outcome.",
    promptInstruction: "Use constructive, forward-looking wording. Do not imply success, safety or improvement unless stated.",
  },
  {
    id: "concerned",
    label: "Concerned",
    shortLabel: "Concerned",
    description: "Highlights uncertainty and stakes without escalating facts.",
    promptInstruction: "Use cautious wording and emphasize uncertainty already present. Do not create new danger or consequences.",
  },
  {
    id: "ironic",
    label: "Ironic",
    shortLabel: "Ironic",
    description: "Light situational irony, never mockery of victims or invented claims.",
    promptInstruction: "Use light, non-hostile situational irony. Do not mock people, tragedy or protected groups. Do not add claims.",
  },
] as const;

export const moodIds = moodDefinitions.map((mood) => mood.id);

export function getMoodDefinition(mood: Mood): MoodDefinition {
  const found = moodDefinitions.find((item) => item.id === mood);
  if (!found) throw new Error(`Unknown mood: ${mood}`);
  return found;
}
