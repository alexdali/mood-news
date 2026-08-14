"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Mood } from "@/domain/news/mood";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function MoodSwitcher({ selected, locale }: { selected: Mood; locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function choose(mood: Mood) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mood", mood);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mood-switcher" role="group" aria-label={uiCopy[locale].moods.label}>
      {(["neutral", "hopeful", "concerned", "ironic"] as const).map((mood) => (
        <button
          key={mood}
          type="button"
          className={mood === selected ? "mood-option mood-option--active" : "mood-option"}
          aria-pressed={mood === selected}
          title={uiCopy[locale].moods.descriptions[mood]}
          onClick={() => choose(mood)}
        >
          {uiCopy[locale].moods[mood]}
        </button>
      ))}
    </div>
  );
}
