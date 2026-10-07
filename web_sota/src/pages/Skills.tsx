import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api } from "@/lib/api";

export function SkillsPage() {
  const [skills, setSkills] = useState<{ name: string; uri: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<{
      success: boolean;
      data: { skills: { name: string; uri: string }[] };
    }>("/api/skills")
      .then((r) => {
        if (!cancelled) setSkills(r.data.skills ?? []);
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
        title="Skills"
        sub="Expert instructions shipped by the server"
      />
      {error ? (
        <Card className="mb-4 border-red-500/40 text-sm text-red-400">
          {error}
        </Card>
      ) : null}
      {skills.length === 0 && !error ? (
        <EmptyState text="No skills shipped yet. The iptv workflow (facets → search → build → VLC/Jellyfin) is documented under Help." />
      ) : (
        <div className="space-y-2">
          {skills.map((s) => (
            <Card key={s.name} className="py-2.5 text-sm">
              <span className="font-medium">{s.name}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">
                {s.uri}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
