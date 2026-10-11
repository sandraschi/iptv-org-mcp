import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api, type PlaylistInfo } from "@/lib/api";

export function InboxPage() {
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [datasets, setDatasets] = useState<Record<string, number> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api<{
        success: boolean;
        data: { playlists: PlaylistInfo[] };
      }>("/api/playlists");
      setPlaylists(res.data.playlists ?? []);
    } catch {
      setPlaylists([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    setMessage("");
    try {
      const res = await api<{
        success: boolean;
        message: string;
        datasets: Record<string, number>;
      }>("/api/iptv/refresh", { method: "POST" });
      setDatasets(res.datasets);
      setMessage("Cache refreshed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      <PageHeader title="Inbox" sub="Freshness + freshly built artifacts">
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          data-testid="inbox-refresh"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {refreshing ? "Refreshing… (slow)" : "Refresh upstream"}
        </button>
      </PageHeader>
      {message ? (
        <Card className="mb-4 text-sm" data-testid="inbox-message">
          {message}
        </Card>
      ) : null}
      {datasets ? (
        <Card className="mb-4" data-testid="inbox-datasets">
          <div className="text-sm font-semibold">Dataset row counts</div>
          <div
            className="mt-1 grid grid-cols-2 gap-1 text-sm text-muted-foreground md:grid-cols-5"
            data-testid="inbox-counts"
          >
            {Object.entries(datasets).map(([k, v]) => (
              <div key={k}>
                {k}: <strong className="text-foreground">{v}</strong>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Recent playlists ({playlists.length})
      </h2>
      {playlists.length === 0 ? (
        <EmptyState text="Nothing here yet. Build a playlist first, or refresh the upstream cache." />
      ) : (
        <div className="space-y-2">
          {playlists.map((p) => (
            <Card key={p.name} className="py-2.5 text-sm">
              <span className="font-medium">{p.name}</span>{" "}
              <span className="text-muted-foreground">
                · {(p.size_bytes / 1024).toFixed(1)} KB ·{" "}
                {new Date(p.modified * 1000).toLocaleString()}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
