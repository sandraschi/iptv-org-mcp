import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, PageHeader, Stat } from "@/components/AppLayout";
import { api } from "@/lib/api";

export function Dashboard() {
  const [stats, setStats] = useState({
    channels: "…",
    streams: "…",
    guides: "…",
    playlists: "…",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [facets, lists] = await Promise.all([
          api<{ success: boolean; channel_count: number }>("/api/iptv/facets"),
          api<{ success: boolean; data: { count: number } }>("/api/playlists"),
        ]);
        if (!cancelled) {
          setStats({
            channels: String(facets.channel_count ?? "—"),
            streams: "—",
            guides: "—",
            playlists: String(lists.data.count ?? 0),
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Free linear TV, curated"
        sub="iptv-org discovery with dead-channel filtering"
      >
        <Link
          to="/playlists"
          data-testid="dashboard-build-cta"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
        >
          Build a playlist
        </Link>
      </PageHeader>
      <Card className="mb-4 border-amber-500/30">
        <p className="text-sm">
          No video is stored or proxied here — only public stream links.
          Blocklist, NSFW flags and Geo-blocked labels are filtered by default.{" "}
          <Link to="/help" className="text-amber-400 underline">
            How it works
          </Link>
        </p>
      </Card>
      {error ? (
        <Card className="mb-4 border-red-500/40 text-sm text-red-400">
          {error}
        </Card>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Channels" value={stats.channels} testid="kpi-channels" />
        <Stat
          label="Playlists built"
          value={stats.playlists}
          testid="kpi-playlists"
        />
        <Stat label="Backend" value="11242" testid="kpi-backend" />
        <Stat label="Frontend" value="11241" testid="kpi-frontend" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Card>
          <h2 className="font-semibold">1. Find</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search 8000+ channels by name, country, category.
          </p>
          <Link
            to="/channels"
            data-testid="dashboard-go-channels"
            className="mt-2 inline-block text-sm text-amber-400 underline"
          >
            Open Channels
          </Link>
        </Card>
        <Card>
          <h2 className="font-semibold">2. Curate</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Health-filtered M3U: no dead, blocked or geo-walled entries.
          </p>
          <Link
            to="/playlists"
            data-testid="dashboard-go-playlists"
            className="mt-2 inline-block text-sm text-amber-400 underline"
          >
            Open Playlists
          </Link>
        </Card>
        <Card>
          <h2 className="font-semibold">3. Watch</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste into VLC, or import M3U + XMLTV into Jellyfin Live TV.
          </p>
          <Link
            to="/guide"
            data-testid="dashboard-go-guide"
            className="mt-2 inline-block text-sm text-amber-400 underline"
          >
            Open Guide
          </Link>
        </Card>
      </div>
    </div>
  );
}
