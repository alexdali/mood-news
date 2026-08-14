import { Suspense, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Suspense fallback={<div className="site-header site-header--loading" aria-hidden="true" />}><SiteHeader /></Suspense>
      <main className="page-shell">{children}</main>
      <Suspense fallback={null}><SiteFooter /></Suspense>
    </div>
  );
}
