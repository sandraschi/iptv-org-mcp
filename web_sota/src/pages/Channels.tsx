import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api, type Channel, type Stream } from "@/lib/api";

const PAGE_SIZE = 20;

export function ChannelsPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [rows, setRows] = useState<Channel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [onlyNsfw, setOnlyNsfw] = useState<"all" | "safe" | "nsfw">("safe");
  const [sort, setSort] = useState<"name" | "country">("name");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "grid">(
    () => (localStorage.getItem("channels_view") as "list" | "grid") ?? "list",
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [streamsByChannel, setStreamsByChannel] = useState<
    Record<string, Stream[]>
  >({});
  const [playMsg, setPlayMsg] = useState("");

  useEffect(() => {
    api<{ success: boolean; categories: { id: string; name: string }[] }>(
      "/api/iptv/facets",
    )
      .then((r) => setCategories(r.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  const run = async () => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const params = new URLSearchParams({ query, country, category });
      const res = await api<{
        success: boolean;
        message: string;
        channels: Channel[];
      }>(`/api/iptv/search?${params}`);
      setRows(res.channels ?? []);
      setTotal((res.channels ?? []).length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "search failed");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const openChannel = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    setPlayMsg("");
    if (streamsByChannel[id]) return;
    try {
      const params = new URLSearchParams({ channel_id: id });
      const res = await api<{
        success: boolean;
        streams: Stream[];
      }>(`/api/iptv/channel?${params}`);
      setStreamsByChannel((m) => ({ ...m, [id]: res.streams ?? [] }));
    } catch (e) {
      setPlayMsg(e instanceof Error ? e.message : "failed to load streams");
    }
  };

  const play = async (s: Stream) => {
    setPlayMsg("");
    try {
      const res = await api<{ success: boolean; message: string }>(
        "/api/iptv/play",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stream_url: s.url }),
        },
      );
      setPlayMsg(res.message);
    } catch (e) {
      setPlayMsg(
        `${e instanceof Error ? e.message : "play failed"} — VLC runs on the server machine; copy the URL instead.`,
      );
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setPlayMsg(
      "Stream URL copied — paste into VLC: Media → Open Network Stream.",
    );
  };

  const filtered = useMemo(() => {
    let out = rows.filter((c) =>
      search
        ? (c.name + c.id).toLowerCase().includes(search.toLowerCase())
        : true,
    );
    if (onlyNsfw === "safe") out = out.filter((c) => !c.is_nsfw);
    if (onlyNsfw === "nsfw") out = out.filter((c) => c.is_nsfw);
    out = [...out].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : (a.country ?? "").localeCompare(b.country ?? ""),
    );
    return out;
  }, [rows, search, onlyNsfw, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Channels"
        sub="Search the curated database (NSFW hidden by default)"
      >
        <button
          type="button"
          onClick={run}
          disabled={loading}
          data-testid="channels-search-btn"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </PageHeader>
      <Card className="mb-4 grid gap-2 md:grid-cols-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Name or id, e.g. ORF"
          data-testid="channels-query"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          placeholder="Country, e.g. AT"
          data-testid="channels-country"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          data-testid="channels-category"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={onlyNsfw}
          onChange={(e) =>
            setOnlyNsfw(e.target.value as "all" | "safe" | "nsfw")
          }
          data-testid="channels-nsfw"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="safe">Hide NSFW</option>
          <option value="all">All</option>
          <option value="nsfw">Only NSFW</option>
        </select>
      </Card>
      {error ? (
        <Card className="mb-4 border-red-500/40 text-sm text-red-400">
          {error}
        </Card>
      ) : null}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Filter results…"
          data-testid="channels-filter"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as "name" | "country");
            setPage(1);
          }}
          data-testid="channels-sort"
          className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
        >
          <option value="name">Sort: name</option>
          <option value="country">Sort: country</option>
        </select>
        <button
          type="button"
          onClick={() => {
            const v = view === "list" ? "grid" : "list";
            setView(v);
            localStorage.setItem("channels_view", v);
          }}
          data-testid="channels-view"
          className="rounded-lg border border-input px-2 py-1.5 text-sm hover:bg-secondary"
        >
          {view === "list" ? "Grid" : "List"}
        </button>
        <span
          data-testid="channels-count"
          className="ml-auto text-muted-foreground"
        >
          {pageRows.length} of {filtered.length} (fetched {total})
        </span>
      </div>
      {pageRows.length === 0 && !loading ? (
        <EmptyState text="No channels yet. Run a search above (empty query lists the country/category slice)." />
      ) : null}
      <div
        className={view === "grid" ? "grid gap-2 md:grid-cols-2" : "space-y-2"}
      >
        {pageRows.map((c) => (
          <Card key={c.id} className="py-2.5">
            <div className="flex items-center gap-3">
              {c.logo ? (
                <img
                  src={c.logo}
                  alt=""
                  className="h-8 w-12 rounded object-contain"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {c.id} · {c.country ?? "?"} ·{" "}
                  {(c.categories ?? []).join(", ")}
                  {c.is_nsfw ? " · NSFW" : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openChannel(c.id)}
                data-testid={`channels-open-${c.id}`}
                className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary"
              >
                {expanded === c.id ? "Hide" : "Streams"}
              </button>
            </div>
            {expanded === c.id ? (
              <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2">
                {(streamsByChannel[c.id] ?? []).length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    Loading streams…
                  </div>
                ) : null}
                {(streamsByChannel[c.id] ?? []).map((s) => (
                  <div
                    key={s.url}
                    className="flex flex-wrap items-center gap-2 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {s.title}
                      {s.quality ? ` · ${s.quality}` : ""}
                      {(s.labels ?? []).length > 0
                        ? ` · ${(s.labels ?? []).join(", ")}`
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => play(s)}
                      data-testid={`channels-play-${c.id}`}
                      className="rounded-lg bg-amber-500 px-3 py-1 text-sm font-semibold text-black hover:bg-amber-400"
                    >
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={() => copyUrl(s.url)}
                      data-testid={`channels-copy-${c.id}`}
                      className="rounded-lg border border-input px-3 py-1 text-sm hover:bg-secondary"
                    >
                      Copy URL
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
      {playMsg ? (
        <Card className="mt-3 text-sm" data-testid="channels-playmsg">
          {playMsg}
        </Card>
      ) : null}
      {pages > 1 ? (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            data-testid="channels-prev"
            className="rounded-lg border border-input px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span data-testid="channels-page">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            data-testid="channels-next"
            className="rounded-lg border border-input px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
