export type ValidationIssue = {
  code: string;
  message: string;
  field?: "title" | "summary";
  values?: string[];
};

export type FactValidationResult = {
  passed: boolean;
  score: number;
  expectedCount: number;
  preservedCount: number;
  missing: string[];
  duplicates: string[];
  unknown: string[];
  addedFacts: string[];
  issues: ValidationIssue[];
};
