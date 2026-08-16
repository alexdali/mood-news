import Link from "next/link";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function AuditPagination(input: {
  locale: Locale;
  page: number;
  pageSize: number;
  total: number;
  previousHref: string;
  nextHref: string;
}) {
  const copy = uiCopy[input.locale].ops;
  const pages = Math.max(1, Math.ceil(input.total / input.pageSize));
  if (pages === 1) return null;
  return (
    <nav className="audit-pagination" aria-label={copy.pagination}>
      {input.page > 1 ? <Link href={input.previousHref}>{copy.previous}</Link> : <span />}
      <span>{copy.page} {input.page} / {pages}</span>
      {input.page < pages ? <Link href={input.nextHref}>{copy.next}</Link> : <span />}
    </nav>
  );
}
