import { ExternalLink } from "lucide-react";

export function SourceBadge({ name, url }: { name: string; url: string }) {
  return (
    <a className="source-link" href={url} target="_blank" rel="noreferrer noopener">
      {name}<ExternalLink size={13} />
    </a>
  );
}
