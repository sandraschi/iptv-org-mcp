import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api, type McpTool } from "@/lib/api";

export function ToolsPage() {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ success: boolean; data: { tools: McpTool[] } }>("/api/tools")
      .then((r) => {
        if (!cancelled) setTools(r.data.tools ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Tools"
        sub="Live MCP surface, discovered from the backend — never hardcoded"
      />
      {error ? (
        <Card
          className="mb-4 border-red-500/40 text-sm text-red-400"
          data-testid="tools-error"
        >
          {error}
        </Card>
      ) : null}
      {tools.length === 0 && !error ? (
        <EmptyState text="Loading tools…" />
      ) : null}
      <div className="space-y-2" data-testid="tools-list">
        {tools.map((t) => (
          <Card key={t.name}>
            <button
              type="button"
              onClick={() => setOpen((o) => (o === t.name ? null : t.name))}
              data-testid={`tool-toggle-${t.name}`}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="font-mono text-sm font-semibold text-amber-400">
                {t.name}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {t.operations
                  ? `portmanteau · ${t.operations.length} ops`
                  : "tool"}
              </span>
            </button>
            {open === t.name ? (
              <div className="mt-2 border-t border-border/60 pt-2">
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {t.description}
                </pre>
                {t.operations && t.operations.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.operations.map((op) => (
                      <code
                        key={op}
                        data-testid={`tool-op-${op}`}
                        className="rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                      >
                        {op}
                      </code>
                    ))}
                  </div>
                ) : null}
                {t.hint ? (
                  <p
                    className="mt-2 text-sm text-muted-foreground"
                    data-testid="tools-hint"
                  >
                    {t.hint}
                  </p>
                ) : null}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
