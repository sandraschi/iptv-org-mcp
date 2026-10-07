import { useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api, type Guide } from "@/lib/api";

export function GuidePage() {
  const [channelId, setChannelId] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ channel_id: channelId, query });
      const res = await api<{
        success: boolean;
        message: string;
        guides: Guide[];
      }>(`/api/iptv/epg?${params}`);
      setRows(res.guides ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "lookup failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="EPG Guide"
        sub="Find XMLTV sources per channel for Jellyfin"
      >
        <button
          type="button"
          onClick={run}
          disabled={loading}
          data-testid="guide-search-btn"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Look up"}
        </button>
      </PageHeader>
      <Card className="mb-4 grid gap-2 md:grid-cols-2">
        <input
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Channel id, e.g. ORF1.at"
          data-testid="guide-channel"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Site filter, e.g. tvguide"
          data-testid="guide-query"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </Card>
      {error ? (
        <Card className="mb-4 border-red-500/40 text-sm text-red-400">
          {error}
        </Card>
      ) : null}
      {rows.length === 0 && !loading ? (
        <EmptyState text="No guides yet. Not every feed has EPG data — look up a channel id first." />
      ) : null}
      <div className="space-y-2">
        {rows.map((g) => (
          <Card
            key={`${g.channel}-${g.site_name ?? g.site ?? ""}-${(g.sources?.[0]?.url ?? "").slice(-32)}`}
            className="py-2.5"
          >
            <div className="text-sm font-medium">
              {g.channel}{" "}
              <span className="text-muted-foreground">
                · {g.site_name ?? g.site}
              </span>
            </div>
            {(g.sources ?? []).map((s) => (
              <code
                key={s.url}
                className="mt-1 block break-all text-xs text-amber-300"
              >
                {s.url}
              </code>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
