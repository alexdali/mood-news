import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { FactValidationResult } from "@/domain/fact-lock/validation";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function FactLockBadge({ validation, rewritten, locale }: { validation: FactValidationResult | null; rewritten: boolean; locale: Locale }) {
  const copy = uiCopy[locale].badges;
  if (!rewritten) return <Badge tone="warning"><ShieldAlert size={13} /> {copy.pending}</Badge>;
  if (!validation?.passed) return <Badge tone="danger"><ShieldAlert size={13} /> {copy.notVerified}</Badge>;
  if (validation.expectedCount === 0) return <Badge tone="info"><CheckCircle2 size={13} /> {copy.noLocks}</Badge>;
  return <Badge tone="success"><ShieldCheck size={13} /> {validation.preservedCount}/{validation.expectedCount} {copy.factsLocked}</Badge>;
}
