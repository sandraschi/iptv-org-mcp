import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api } from "@/lib/api";

interface SkillMeta {
  name: string;
  uri: string;
  description?: string;
}

export function SkillsPage() {
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<{ success: boolean; data: { skills: SkillMeta[] } }>("/api/skills")
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

  const toggle = async (name: string) => {
    if (open === name) {
      setOpen(null);
      return;
    }
    setOpen(name);
    setContent("");
    try {
      const res = await api<{ success: boolean; data: { content: string } }>(
        `/api/skills/${name}`,
      );
      setContent(res.data.content ?? "");
    } catch (e) {
      setContent(`Failed to load skill: ${e instanceof Error ? e.message : e}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Skills"
        sub="Expert instructions shipped by the server"
      />
      {error ? (
        <Card
          className="mb-4 border-red-500/40 text-sm text-red-400"
          data-testid="skills-error"
        >
          {error}
        </Card>
      ) : null}
      {skills.length === 0 && !error ? (
        <EmptyState text="No skills shipped yet." />
      ) : (
        <div className="space-y-2" data-testid="skills-list">
          {skills.map((s) => (
            <Card key={s.name}>
              <button
                type="button"
                onClick={() => toggle(s.name)}
                data-testid={`skill-toggle-${s.name}`}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-sm font-semibold text-amber-400">
                  {s.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.uri}
                </span>
              </button>
              {s.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.description}
                </p>
              ) : null}
              {open === s.name ? (
                <div
                  className="prose prose-sm prose-invert mt-2 max-w-none border-t border-border/60 pt-2 text-sm"
                  data-testid={`skill-body-${s.name}`}
                >
                  <ReactMarkdown>{content || "Loading…"}</ReactMarkdown>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
