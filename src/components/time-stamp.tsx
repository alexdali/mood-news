import { formatDistanceToNowStrict } from "date-fns";

export function TimeStamp({ date }: { date: string }) {
  const parsed = new Date(date);
  const label = Number.isNaN(parsed.getTime()) ? date : formatDistanceToNowStrict(parsed, { addSuffix: true });
  return <time dateTime={date} title={date}>{label}</time>;
}
