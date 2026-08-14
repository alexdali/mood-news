import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { FactValidationResult } from "@/domain/fact-lock/validation";
import { Badge } from "@/components/ui/badge";

export function FactLockBadge({ validation, rewritten }: { validation: FactValidationResult | null; rewritten: boolean }) {
  if (!rewritten) return <Badge tone="warning"><ShieldAlert size={13} /> Original — AI pending</Badge>;
  if (!validation?.passed) return <Badge tone="danger"><ShieldAlert size={13} /> Not verified</Badge>;
  if (validation.expectedCount === 0) return <Badge tone="info"><CheckCircle2 size={13} /> Checked — no locks found</Badge>;
  return <Badge tone="success"><ShieldCheck size={13} /> {validation.preservedCount}/{validation.expectedCount} facts locked</Badge>;
}
