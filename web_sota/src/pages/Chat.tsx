import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api } from "@/lib/api";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const HISTORY_KEY = "iptv_chat_history";
const PERSONALITY_KEY = "iptv_chat_personality";
const HISTORY_CAP = 100;

const FALLBACK_SYSTEM =
  "You are the iptv-org-mcp assistant. Help with free linear TV: finding channels by country/category, building health-filtered M3U playlists, EPG lookups, VLC playback and Jellyfin Live TV import. Upstream stores no video, only public links. Never promise a stream is alive; suggest probing. Keep answers short.";

const PERSONALITIES = [
  {
    id: "concise",
    label: "Concise",
    system:
      "Answer in the fewest words that still quote kept/excluded or alive/total numbers.",
  },
  {
    id: "planner",
    label: "Evening planner",
    system:
      "Plan tonight's viewing: ask country + category when missing, then walk facets, search, build_playlist in order.",
  },
  {
    id: "jellyfin",
    label: "Jellyfin importer",
    system:
      "Guide Jellyfin Live TV imports step by step: tuner URL, XMLTV sources, mapping, guide refresh. Warn when a channel has no EPG rows.",
  },
  {
    id: "debug",
    label: "Stream doctor",
    system:
      "Diagnose dead or black streams: check_streams first, then propose a probed rebuild or another feed for the same channel.",
  },
] as const;

const EXAMPLES = [
  "Austrian news for tonight",
  "UK sports that actually play",
  "Build a German news playlist for VLC",
  "Why is my stream black in VLC?",
  "Import German channels into Jellyfin",
  "Which EPG guides exist for ORF1.at?",
];

export function ChatPage() {
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [modelCount, setModelCount] = useState(0);
  const [personality, setPersonality] = useState(
    () => localStorage.getItem(PERSONALITY_KEY) ?? "concise",
  );
  const [skill, setSkill] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as Msg[];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api<{ success: boolean; data: { content: string } }>(
          "/api/skills/iptv-operator",
        );
        if (!cancelled) setSkill(s.data.content ?? "");
      } catch {
        if (!cancelled) setSkill("");
      }
      try {
        const d = await api<{
          success: boolean;
          data: { providers: { name: string; models: string[] }[] };
        }>("/api/llm/discover");
        if (cancelled) return;
        const savedP = localStorage.getItem("llm_provider") ?? "";
        const savedM = localStorage.getItem("llm_model") ?? "";
        const hit =
          d.data.providers.find((p) => p.name === savedP) ??
          d.data.providers[0];
        setProvider(hit?.name ?? "");
        setModel((savedM || hit?.models[0]) ?? "");
        setModelCount(hit?.models.length ?? 0);
      } catch {
        if (!cancelled) {
          setProvider(localStorage.getItem("llm_provider") ?? "");
          setModel(localStorage.getItem("llm_model") ?? "");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(messages.slice(-HISTORY_CAP)),
    );
  }, [messages]);

  const pickPersonality = (id: string) => {
    setPersonality(id);
    localStorage.setItem(PERSONALITY_KEY, id);
  };

  const systemPrompt = () => {
    const p = PERSONALITIES.find((x) => x.id === personality);
    const base = p ? `${FALLBACK_SYSTEM} Style: ${p.system}` : FALLBACK_SYSTEM;
    return skill ? `${skill}\n\n${base}` : base;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!provider || !model) {
      setError(
        "No local LLM selected. Start Ollama or LM Studio, then re-probe in Settings.",
      );
      return;
    }
    setError("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await api<{
        success: boolean;
        message?: string;
        data: { choices: { message: { content: string } }[] };
      }>("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          messages: [{ role: "system", content: systemPrompt() }, ...next],
        }),
      });
      if (!res.success) throw new Error(res.message ?? "chat failed");
      const reply = res.data.choices[0]?.message?.content ?? "(empty reply)";
      setMessages([...next, { role: "assistant" as const, content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "send failed");
    } finally {
      setSending(false);
    }
  };

  const exportTxt = () => {
    const body = messages
      .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "iptv-chat.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return (
    <div data-testid="chat-page">
      <PageHeader
        title="Chat"
        sub={`${provider || "no provider"} · ${model || "no model"} · ${modelCount} models${skill ? " · skill-loaded" : ""}`}
      >
        <button
          type="button"
          onClick={exportTxt}
          disabled={messages.length === 0}
          data-testid="chat-export"
          className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-40"
        >
          Export
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={messages.length === 0}
          data-testid="chat-clear"
          className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-40"
        >
          Clear
        </button>
      </PageHeader>
      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        data-testid="chat-controls"
      >
        <label
          className="text-sm text-muted-foreground"
          htmlFor="chat-personality"
        >
          Personality
        </label>
        <select
          id="chat-personality"
          value={personality}
          onChange={(e) => pickPersonality(e.target.value)}
          data-testid="personality-select"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
        >
          {PERSONALITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <Card className="mb-4 border-red-500/40 text-sm text-red-400">
          {error}
        </Card>
      ) : null}
      {messages.length === 0 ? (
        <>
          <EmptyState text="Ask about channels, playlists, EPG or Jellyfin import. History persists locally." />
          <div
            className="mt-3 flex flex-wrap gap-2"
            data-testid="example-prompts"
          >
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setInput(ex)}
                className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary"
              >
                {ex}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mb-4 space-y-2" data-testid="chat-messages">
          {messages.map((m) => (
            <Card
              key={`${m.role}-${m.content.length}-${m.content.slice(0, 24)}`}
              className={
                m.role === "user" ? "ml-8" : "mr-8 border-amber-500/20"
              }
            >
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {m.role}
              </div>
              <div className="whitespace-pre-wrap text-sm">{m.content}</div>
            </Card>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. Austrian news channels for VLC…"
          data-testid="chat-input"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending}
          data-testid="chat-send"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
