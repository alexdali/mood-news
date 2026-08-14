import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-shell">{children}</main>
      <footer className="site-footer">
        <span>Mood News Grid</span>
        <span>Real sources · validated tone transformations</span>
      </footer>
    </div>
  );
}
