import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function ProcessingStatus({ model, promptVersion, locale }: { model?: string; promptVersion?: string; locale: Locale }) {
  if (!model) return <Badge tone="warning">{uiCopy[locale].badges.awaiting}</Badge>;
  return <span className="processing-status"><Badge tone="info">{model}</Badge><small>{promptVersion}</small></span>;
}
