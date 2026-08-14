"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getLocale, uiCopy, withLocale } from "@/i18n/ui";
import { Suspense } from "react";

export default function NotFound() {
  return <Suspense fallback={null}><NotFoundContent /></Suspense>;
}

function NotFoundContent() {
  const locale = getLocale(useSearchParams().get("lang"));
  const copy = uiCopy[locale].states;
  return <section className="error-state"><h1>{copy.notFound}</h1><p>{copy.notFoundBody}</p><Link className="button" href={withLocale("/", locale)}>{copy.back}</Link></section>;
}
