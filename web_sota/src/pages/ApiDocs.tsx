import { useState } from "react";
import { Card, PageHeader } from "@/components/AppLayout";

const QUICK_REF = [
  "GET /api/health",
  "GET /api/tools",
  "GET /api/playlists",
  "GET /api/iptv/facets",
  "GET /api/iptv/search?query=ORF&country=AT",
  "GET /api/iptv/playlist?country=AT",
  "GET /api/iptv/epg?channel_id=ORF1.at",
  "POST /api/iptv/refresh",
  "POST /api/llm/chat",
];

export function ApiDocsPage() {
  const [view, setView] = useState<"swagger" | "redoc">("swagger");
  const src = view === "swagger" ? "/docs" : "/redoc";
  return (
    <div>
      <PageHeader title="API Docs" sub="Live Swagger UI + ReDoc from the FastAPI backend">
        <button
          onClick={() => setView((v) => (v === "swagger" ? "redoc" : "swagger"))}
          data-testid="apidocs-toggle"
          className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary"
        >
          {view === "swagger" ? "Show ReDoc" : "Show Swagger"}
        </button>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          data-testid="apidocs-open"
          className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Open in browser
        </a>
      </PageHeader>
      <Card className="mb-3">
        <div className="flex gap-2 overflow-x-auto text-xs" data-testid="apidocs-quickref">
          {QUICK_REF.map((q) => (
            <code key={q} className="whitespace-nowrap rounded-md bg-secondary px-2 py-1 font-mono">
              {q}
            </code>
          ))}
        </div>
      </Card>
      <Card className="overflow-hidden p-0">
        <iframe
          src={src}
          title={view}
          data-testid="apidocs-frame"
          className="h-[70vh] w-full border-0 bg-white"
        />
      </Card>
    </div>
  );
}
