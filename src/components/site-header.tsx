import Link from "next/link";
import { Activity, BookOpen, Grid3X3, Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Mood News Grid home">
        <span className="brand__mark"><Sparkles size={19} /></span>
        <span>
          <strong>Mood News Grid</strong>
          <small>Facts stay fixed. Tone can move.</small>
        </span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/"><Grid3X3 size={17} /> News</Link>
        <Link href="/ops"><Activity size={17} /> Operations</Link>
        <Link href="/about"><BookOpen size={17} /> Method</Link>
      </nav>
    </header>
  );
}
