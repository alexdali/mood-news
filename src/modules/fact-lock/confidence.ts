import type { FactValidationResult } from "@/domain/fact-lock/validation";

export type FactLockConfidence = {
  label: "verified" | "warning" | "rejected";
  percentage: number;
  explanation: string;
};

export function getFactLockConfidence(validation: FactValidationResult | null): FactLockConfidence {
  if (!validation) return {
    label: "warning",
    percentage: 0,
    explanation: "No validation record is available.",
  };
  if (!validation.passed) return {
    label: "rejected",
    percentage: validation.score,
    explanation: "The generated text failed deterministic fact checks and must not be displayed as verified.",
  };
  return {
    label: "verified",
    percentage: validation.score,
    explanation: `${validation.preservedCount} of ${validation.expectedCount} protected fact occurrences were preserved, with no new concrete facts detected.`,
  };
}
