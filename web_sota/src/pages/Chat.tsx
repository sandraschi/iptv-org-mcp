import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useLlm } from "@/store/llm";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const HISTORY_KEY = "iptv_chat_history";

const SYSTEM = `You are the iptv-org-mcp assistant. Help with free linear TV: finding channels by country/category, building health-filtered M3U playlists, EPG lookups, VLC playback and Jellyfin Live TV import. Upstream stores no video, only public links. Never promise a stream is alive; suggest probing. Keep answers short.`;

export function ChatPage() {
  const selectedProvider = useLlm((s) => s.selectedProvider);
  const selectedModel = useLlm((s) => s.selectedModel);
  const availableModels = useLlm((s) => s.availableModels);
  const probed = useLlm((s) => s.probed);
  const probe = useLlm((s) => s.probe);
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
    if (!probed) probe();
  }, [probed, probe]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-50)));
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!selectedProvider || !selectedModel) {
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
          provider: selectedProvider,
          model: selectedModel,
          messages: [{ role: "system", content: SYSTEM }, ...next],
        }),
      });
      if (!res.success) throw new Error(res.message ?? "chat failed");
      const reply = res.data.choices[0]?.message?.content ?? "(empty reply)";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Chat"
        sub={`${selectedProvider || "no provider"} · ${selectedModel || "no model"} · ${availableModels.length} models`}
      >
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            localStorage.removeItem(HISTORY_KEY);
          }}
          data-testid="chat-clear"
          className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Clear
        </button>
      </PageHeader>
      {error ? (
        <Card className="mb-4 border-red-500/40 text-sm text-red-400">
          {error}
        </Card>
      ) : null}
      {messages.length === 0 ? (
        <EmptyState text="Ask about channels, playlists, EPG or Jellyfin import. History persists locally." />
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
