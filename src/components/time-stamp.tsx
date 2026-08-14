import { formatDistanceToNowStrict } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import type { Locale } from "@/i18n/ui";

export function TimeStamp({ date, locale }: { date: string; locale: Locale }) {
  const parsed = new Date(date);
  const label = Number.isNaN(parsed.getTime()) ? date : formatDistanceToNowStrict(parsed, { addSuffix: true, locale: locale === "ru" ? ru : enUS });
  return <time dateTime={date} title={date}>{label}</time>;
}
