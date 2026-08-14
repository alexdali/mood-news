import type { ReactNode } from "react";

export function StatCard({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode }) {
  return (
    <article className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>
    </article>
  );
}
