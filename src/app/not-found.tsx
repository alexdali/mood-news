import Link from "next/link";

export default function NotFound() {
  return <section className="error-state"><h1>Not found</h1><p>The requested news record does not exist.</p><Link className="button" href="/">Back to grid</Link></section>;
}
