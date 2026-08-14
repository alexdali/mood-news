import { ArrowRight, Database, LockKeyhole, RefreshCw, WandSparkles } from "lucide-react";
import Link from "next/link";
import { getLocale, uiCopy, withLocale } from "@/i18n/ui";

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = getLocale((await searchParams).lang);
  const copy = uiCopy[locale].about;
  const icons = [<RefreshCw key="refresh" />, <LockKeyhole key="lock" />, <WandSparkles key="wand" />, <Database key="database" />];
  const steps = copy.steps.map(([title, text], index) => ({ icon: icons[index], title, text }));
  return (
    <>
      <section className="page-heading"><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.titleTop}<br />{copy.titleBottom}</h1><p>{copy.intro}</p></section>
      <section className="process-grid">{steps.map((step) => <article key={step.title}><span>{step.icon}</span><h2>{step.title}</h2><p>{step.text}</p></article>)}</section>
      <section className="method-panel prose-panel"><h2>{copy.confidenceTitle}</h2><p>{copy.confidenceBody}</p><h2>{copy.limitsTitle}</h2><p>{copy.limitsBody}</p><Link href={withLocale("/ops", locale)} className="detail-link">{copy.evidence} <ArrowRight size={15} /></Link></section>
    </>
  );
}
