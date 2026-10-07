import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api, type PlaylistInfo } from "@/lib/api";

export function PlaylistsPage() {
  const [country, setCountry] = useState("AT");
  const [category, setCategory] = useState("");
  const [probe, setProbe] = useState(false);
  const [maxEntries, setMaxEntries] = useState(200);
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState<{ playlist_url: string; stats: { kept: number; excluded: number } } | null>(null);
  const [existing, setExisting] = useState<PlaylistInfo[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await api<{ success: boolean; data: { playlists: PlaylistInfo[] } }>("/api/playlists");
      setExisting(res.data.playlists ?? []);
    } catch {
      setExisting([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const build = async () => {
    setBuilding(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams({
        country,
        category,
        probe: String(probe),
        max_entries: String(maxEntries),
      });
      const res = await api<{
        success: boolean;
        playlist_url: string;
        stats: { kept: number; excluded: number };
      }>(`/api/iptv/playlist?${params}`);
      setResult({ playlist_url: res.playlist_url, stats: res.stats });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "build failed");
    } finally {
      setBuilding(false);
    }
  };

  const copy = async (url: string) => {
    const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(full).catch(() => undefined);
  };

  return (
    <div>
      <PageHeader title="Playlists" sub="Health-filtered M3U builder: dead, blocked and geo-walled entries stay out" />
      <Card className="mb-4 grid gap-2 md:grid-cols-4">
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          placeholder="Countries, e.g. AT,DE"
          data-testid="playlist-country"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Categories, e.g. news"
          data-testid="playlist-category"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={maxEntries}
          min={1}
          max={2000}
          onChange={(e) => setMaxEntries(Number(e.target.value))}
          data-testid="playlist-max"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={probe}
            onChange={(e) => setProbe(e.target.checked)}
            data-testid="playlist-probe"
          />
          Probe liveness (slow)
        </label>
      </Card>
      <button
        onClick={build}
        disabled={building}
        data-testid="playlist-build"
        className="mb-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
      >
        {building ? "Building…" : "Build playlist"}
      </button>
      {error ? <Card className="mb-4 border-red-500/40 text-sm text-red-400">{error}</Card> : null}
      {result ? (
        <Card className="mb-4 border-green-500/40" data-testid="playlist-result">
          <div className="text-sm">
            Kept <strong>{result.stats.kept}</strong>, excluded <strong>{result.stats.excluded}</strong>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all text-xs text-amber-300">{result.playlist_url}</code>
            <button
              onClick={() => copy(result.playlist_url)}
              data-testid="playlist-copy"
              className="rounded-lg border border-input px-3 py-1 text-xs hover:bg-secondary"
            >
              Copy URL
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            VLC: Media → Open Network Stream → paste. Jellyfin: Dashboard → Live TV → M3U tuner → paste.
          </p>
        </Card>
      ) : null}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Built playlists ({existing.length})
      </h2>
      {existing.length === 0 ? (
        <EmptyState text="None yet. Build one above — it lands here with a servable URL." />
      ) : (
        <div className="space-y-2">
          {existing.map((p) => (
            <Card key={p.name} className="flex flex-wrap items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(p.size_bytes / 1024).toFixed(1)} KB ·{" "}
                  {new Date(p.modified * 1000).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => copy(p.url)}
                data-testid={`playlist-copy-${p.name}`}
                className="rounded-lg border border-input px-3 py-1 text-xs hover:bg-secondary"
              >
                Copy URL
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
