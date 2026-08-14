import { z } from "zod";
import { moods } from "@/domain/news/mood";

const variantSchema = z.object({
  mood: z.enum(moods),
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(4_000),
});

export const rewritePayloadSchema = z.object({
  variants: z.array(variantSchema).length(moods.length).superRefine((variants, ctx) => {
    const received = new Set(variants.map((variant) => variant.mood));
    for (const mood of moods) {
      if (!received.has(mood)) {
        ctx.addIssue({ code: "custom", message: `Missing mood variant: ${mood}` });
      }
    }
  }),
});

export const rewriteResponseJsonSchema = {
  name: "mood_news_rewrites",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      variants: {
        type: "array",
        minItems: moods.length,
        maxItems: moods.length,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            mood: { type: "string", enum: [...moods] },
            title: { type: "string", minLength: 1, maxLength: 500 },
            summary: { type: "string", minLength: 1, maxLength: 4_000 },
          },
          required: ["mood", "title", "summary"],
        },
      },
    },
    required: ["variants"],
  },
} as const;
