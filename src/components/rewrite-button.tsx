"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RewriteButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function generate() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/news/${articleId}/rewrite`, { method: "POST" });
      const payload = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? "Rewrite failed");
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
        <WandSparkles size={16} /> {state === "loading" ? "Generating and validating…" : "Generate all moods"}
      </Button>
      {state === "error" ? <p className="form-error">{message}</p> : null}
    </div>
  );
}
