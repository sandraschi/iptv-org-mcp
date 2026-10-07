import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api } from "@/lib/api";

interface LogRec {
  level: string;
  logger: string;
  message: string;
}

export function LogsPage() {
  const [records, setRecords] = useState<LogRec[]>([]);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (level) params.set("level", level);
      if (search) params.set("search", search);
      const res = await api<{ success: boolean; data: { records: LogRec[] } }>(
        `/api/logs?${params}`,
      );
      setRecords(res.data.records ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  }, [level, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Logs" sub="In-memory ring buffer from the backend">
        <button
          type="button"
          onClick={load}
          data-testid="logs-reload"
          className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Reload
        </button>
      </PageHeader>
      <Card className="mb-4 flex flex-wrap gap-2">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          data-testid="logs-level"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All levels</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search messages…"
          data-testid="logs-search"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
        />
      </Card>
      {error ? (
        <Card className="mb-4 border-red-500/40 text-sm text-red-400">
          {error}
        </Card>
      ) : null}
      {records.length === 0 ? (
        <EmptyState text="No log records match. The ring holds the last 500 entries." />
      ) : (
        <Card>
          <div className="space-y-1 font-mono text-xs" data-testid="logs-count">
            <div className="text-muted-foreground">
              {records.length} records
            </div>
            {records.map((r) => (
              <div
                key={`${r.level}-${r.logger}-${r.message.length}-${r.message.slice(0, 48)}`}
                className="break-words border-b border-border/40 py-1"
              >
                <span
                  className={
                    r.level === "ERROR"
                      ? "text-red-400"
                      : r.level === "WARNING"
                        ? "text-amber-400"
                        : "text-green-400"
                  }
                >
                  [{r.level}]
                </span>{" "}
                <span className="text-muted-foreground">{r.logger}:</span>{" "}
                {r.message}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
