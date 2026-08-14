"use client";

import { useSearchParams } from "next/navigation";
import { getLocale, uiCopy } from "@/i18n/ui";

export function SiteFooter() {
  const locale = getLocale(useSearchParams().get("lang"));
  return <footer className="site-footer"><span>Mood News Grid</span><span>{uiCopy[locale].footer}</span></footer>;
}
