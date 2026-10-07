import { useState } from "react";
import { Card, PageHeader } from "@/components/AppLayout";

const TABS = ["Start", "VLC", "Jellyfin", "API + ports", "Fix errors", "FAQ"] as const;

const BODY: Record<(typeof TABS)[number], string[]> = {
  Start: [
    "No account, no key, no install: the upstream is a public static CDN.",
    "1. Inbox → Refresh upstream (one slow call, ~13 JSON snapshots, 24h cache).",
    "2. Channels → search by name, country (AT, DE), category.",
    "3. Playlists → build a health-filtered M3U and copy its URL.",
    "4. Paste the URL into VLC, or import M3U + XMLTV into Jellyfin Live TV.",
  ],
  VLC: [
    "VLC → Media → Open Network Stream → paste the playlist URL.",
    "Single channel: POST /api/iptv via MCP play_in_vlc, or paste any stream URL directly.",
    "Black screen? The stream is dead or geo-blocked from Austria — rebuild with Probe liveness on.",
    "VLC executable is auto-detected from PATH; override with IPTV_ORG_MCP_VLC_PATH.",
  ],
  Jellyfin: [
    "Jellyfin Dashboard → Live TV → Add Tuner → M3U Playlist → paste playlist URL.",
    "Add EPG source → XMLTV URL (see EPG Guide page per channel).",
    "Map channels → Refresh Guide Data.",
    "Verify with jellyfin-mcp: jellyfin_livetv(operation='guide').",
  ],
  "API + ports": [
    "Backend 11242: REST /api/*, MCP at POST /mcp, Swagger at /docs, ReDoc at /redoc.",
    "Frontend 11241: this app, proxies /api /mcp /docs /openapi.json /redoc.",
    "Key routes: /api/health, /api/tools, /api/playlists, /api/playlists/*.m3u, /api/logs.",
    "IPTV bridge: /api/iptv/facets, /search, /playlist, /epg, POST /refresh.",
    "LLM: /api/llm/discover, /api/llm/ollama_state, /api/llm/gpus, POST /api/llm/chat.",
  ],
  "Fix errors": [
    "Empty playlist (kept=0): filters too tight — drop Probe, widen country/category, Refresh first.",
    "VLC opens but nothing plays: dead or geo-blocked — check_streams, rebuild with probe=true.",
    "Slow first call: cold cache fetching upstream; later calls are instant until TTL expiry.",
    "Jellyfin sees no guide: not every feed has EPG rows — check the Guide page per channel.",
    "LLM chat disabled: start Ollama/LM Studio, re-probe in Settings.",
  ],
  FAQ: [
    "Is this piracy? No: iptv-org links only freely available public streams; DMCA blocklist enforced.",
    "Why do channels die? Upstream volunteers re-check continuously; some go offline or geo-block.",
    "Do you proxy video? Never. The server only serves links, JSON and generated M3U text.",
    "Where is data cached? ./data (snapshots) + ./data/playlists (generated M3Us), 24h TTL.",
  ],
};

export function HelpPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Start");
  return (
    <div>
      <PageHeader title="Help" sub="Wrappee, workflows, API, and fixes" />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-testid={`help-tab-${t.replace(/[^a-z]+/gi, "-").toLowerCase()}`}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t ? "bg-amber-500 font-semibold text-black" : "border border-input hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <Card>
        <ul className="list-disc space-y-1.5 pl-5 text-sm" data-testid="help-body">
          {BODY[tab].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
