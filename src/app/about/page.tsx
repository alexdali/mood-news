import { ArrowRight, Database, LockKeyhole, RefreshCw, WandSparkles } from "lucide-react";

export default function AboutPage() {
  const steps = [
    { icon: <RefreshCw />, title: "1. Import", text: "BBC RSS and the optional Guardian API are checked on schedule. Raw source payloads and normalized records are stored separately." },
    { icon: <LockKeyhole />, title: "2. Protect", text: "Numbers, dates, money, quotes, URLs and likely named entities are replaced with field-specific placeholders." },
    { icon: <WandSparkles />, title: "3. Rewrite", text: "DeepSeek receives protected text and returns all four moods in one structured response. Luna is tried only after failure." },
    { icon: <Database />, title: "4. Validate and persist", text: "Every placeholder must survive exactly once in the same field. New concrete facts, malformed JSON and abnormal length are rejected." },
  ];
  return (
    <>
      <section className="page-heading"><span className="eyebrow">Method, not magic</span><h1>AI is the stylist.<br />Code is the fact gate.</h1><p>The system does not claim that a source is true. It claims something narrower and testable: the displayed rewrite preserved the concrete facts present in the imported source fragment.</p></section>
      <section className="process-grid">{steps.map((step) => <article key={step.title}><span>{step.icon}</span><h2>{step.title}</h2><p>{step.text}</p></article>)}</section>
      <section className="method-panel prose-panel"><h2>What the confidence indicator means</h2><p>A green Fact Lock badge is deterministic, not an LLM self-score. It means every protected occurrence was retained, no protected occurrence was duplicated or moved between title and summary, and the post-restoration scan found no additional numbers, dates, quotes, money values or URLs.</p><h2>What it does not mean</h2><p>It does not independently verify the reporting, detect every semantic implication, or prove that an ironic framing is ethically appropriate. Those limits are explicit in the UI and documentation.</p><a href="/ops" className="detail-link">Open operational evidence <ArrowRight size={15} /></a></section>
    </>
  );
}
