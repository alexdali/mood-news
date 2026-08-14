"use client";

import { useSearchParams } from "next/navigation";
import { getLocale, uiCopy } from "@/i18n/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const copy = uiCopy[getLocale(useSearchParams().get("lang"))].states;
  return (
    <section className="error-state">
      <h1>{copy.error}</h1>
      <p>{error.message}</p>
      <button className="button" type="button" onClick={reset}>{copy.retry}</button>
    </section>
  );
}
