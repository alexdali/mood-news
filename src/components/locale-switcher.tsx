"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function choose(nextLocale: Locale) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLocale);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="locale-switcher" role="group" aria-label={uiCopy[locale].header.language}>
      {(["en", "ru"] as const).map((option) => (
        <button key={option} type="button" aria-pressed={option === locale} onClick={() => choose(option)}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
