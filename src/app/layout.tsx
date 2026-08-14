import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { AppShell } from "@/components/app-shell";
import { appConfig } from "@/config/app";

export const metadata: Metadata = {
  title: { default: appConfig.name, template: `%s · ${appConfig.name}` },
  description: appConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
