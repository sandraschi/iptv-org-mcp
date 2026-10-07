import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useLlm } from "@/store/llm";

export function SettingsPage() {
  const llm = useLlm();
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!llm.probed) llm.probe();
    api("/api/health")
      .then((h) => setHealth(h as Record<string, unknown>))
      .catch((e) => setError(e instanceof Error ? e.message : "health failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader title="Settings" sub="Backend health + local LLM provider" />
      {error ? <Card className="mb-4 border-red-500/40 text-sm text-red-400">{error}</Card> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Backend</h2>
          <pre className="overflow-auto text-xs text-muted-foreground" data-testid="settings-health">
            {health ? JSON.stringify(health, null, 2) : "probing…"}
          </pre>
          <div className="mt-2 text-xs text-muted-foreground">
            Ports: backend 11242 · frontend 11241 · MCP at <code>/mcp</code>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Local LLM</h2>
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="llm-provider">
            Provider
          </label>
          <select
            id="llm-provider"
            value={llm.selectedProvider}
            onChange={(e) => llm.setProvider(e.target.value)}
            data-testid="llm-provider-select"
            className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {llm.providers.length === 0 ? <option value="">No local LLM detected</option> : null}
            {llm.providers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} (:{p.port}) · {p.models.length} models
              </option>
            ))}
          </select>
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="llm-model">
            Model
          </label>
          <select
            id="llm-model"
            value={llm.selectedModel}
            onChange={(e) => llm.setModel(e.target.value)}
            data-testid="llm-model-select"
            className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {llm.availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
                {llm.loadedModels.includes(m) ? " (loaded)" : ""}
              </option>
            ))}
          </select>
          {llm.gpus.length > 1 ? (
            <>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="llm-gpu">
                Target GPU (primary stays free for resident models)
              </label>
              <select
                id="llm-gpu"
                value={llm.targetGpuIndex}
                onChange={(e) => llm.setTargetGpu(Number(e.target.value))}
                data-testid="llm-gpu-select"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {llm.gpus.map((g) => (
                  <option key={g.index} value={g.index}>
                    GPU {g.index} · {g.name} · {(g.vramMb / 1024).toFixed(0)} GB
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <button
            onClick={() => llm.probe()}
            data-testid="llm-reprobe"
            className="mt-2 rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary"
          >
            Re-probe
          </button>
          {llm.providers.length === 0 && llm.probed ? (
            <p className="mt-2 text-xs text-amber-400">
              Install Ollama or LM Studio to enable AI features.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
