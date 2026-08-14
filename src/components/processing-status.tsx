import { Badge } from "@/components/ui/badge";

export function ProcessingStatus({ model, promptVersion }: { model?: string; promptVersion?: string }) {
  if (!model) return <Badge tone="warning">Awaiting rewrite</Badge>;
  return <span className="processing-status"><Badge tone="info">{model}</Badge><small>{promptVersion}</small></span>;
}
