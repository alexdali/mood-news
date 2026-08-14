"use client";

import Link from "next/link";
import { Activity, BookOpen, Grid3X3, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getLocale, uiCopy, withLocale } from "@/i18n/ui";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function SiteHeader() {
  const locale = getLocale(useSearchParams().get("lang"));
  const copy = uiCopy[locale];
  return (
    <header className="site-header">
      <Link href={withLocale("/", locale)} className="brand" aria-label={copy.header.home}>
        <span className="brand__mark"><Sparkles size={19} /></span>
        <span>
          <strong>Mood News Grid</strong>
          <small>{copy.header.tagline}</small>
        </span>
      </Link>
      <div className="header-actions">
        <nav className="main-nav" aria-label={copy.header.navigation}>
          <Link href={withLocale("/", locale)}><Grid3X3 size={17} /> {copy.header.news}</Link>
          <Link href={withLocale("/ops", locale)}><Activity size={17} /> {copy.header.operations}</Link>
          <Link href={withLocale("/about", locale)}><BookOpen size={17} /> {copy.header.method}</Link>
        </nav>
        <LocaleSwitcher locale={locale} />
      </div>
    </header>
  );
}
