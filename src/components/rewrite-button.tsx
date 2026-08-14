"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function RewriteButton({ articleId, locale }: { articleId: string; locale: Locale }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function generate() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/news/${articleId}/rewrite?lang=${locale}`, { method: "POST" });
      const payload = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !payload.ok) {
        const providerMessage = payload.error?.message ?? "";
        throw new Error(providerMessage.includes("OPENROUTER_API_KEY") ? uiCopy[locale].detail.missingKey : providerMessage || uiCopy[locale].detail.rewriteFailed);
      }
      router.refresh();
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="rewrite-action">
      <Button type="button" onClick={generate} disabled={state === "loading"}>
        <WandSparkles size={16} /> {state === "loading" ? uiCopy[locale].detail.generating : uiCopy[locale].detail.generate}
      </Button>
      {state === "error" ? <p className="form-error">{message}</p> : null}
    </div>
  );
}
