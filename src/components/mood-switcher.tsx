"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { moodDefinitions } from "@/config/moods";
import type { Mood } from "@/domain/news/mood";

export function MoodSwitcher({ selected }: { selected: Mood }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function choose(mood: Mood) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mood", mood);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mood-switcher" role="group" aria-label="Choose news mood">
      {moodDefinitions.map((mood) => (
        <button
          key={mood.id}
          type="button"
          className={mood.id === selected ? "mood-option mood-option--active" : "mood-option"}
          aria-pressed={mood.id === selected}
          title={mood.description}
          onClick={() => choose(mood.id)}
        >
          {mood.shortLabel}
        </button>
      ))}
    </div>
  );
}
