export const factTypes = [
  "url",
  "quote",
  "money",
  "percentage",
  "date",
  "time",
  "number",
  "organization",
  "person",
  "place",
  "entity",
] as const;

export type FactType = (typeof factTypes)[number];
export type FactSourceField = "title" | "summary";

export type FactCandidate = {
  factType: FactType;
  value: string;
  normalizedValue: string;
  sourceField: FactSourceField;
  startIndex: number;
  endIndex: number;
  extractor: string;
  priority: number;
};

export type ProtectedFact = Omit<FactCandidate, "priority"> & {
  id: string;
  articleId: string;
  placeholder: string;
  createdAt: string;
};

export type ProtectedArticleText = {
  title: string;
  summary: string;
  facts: ProtectedFact[];
};
