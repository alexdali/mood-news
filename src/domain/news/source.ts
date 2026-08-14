export type NewsSource = {
  id: string;
  kind: "rss" | "guardian";
  name: string;
  baseUrl: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
