/** Typed fetch wrapper for the backend REST bridge (all calls proxied by vite). */

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${path} ${text.slice(0, 160)}`);
  }
  return (await res.json()) as T;
}

export interface Channel {
  id: string;
  name: string;
  country?: string;
  categories?: string[];
  is_nsfw?: boolean;
  logo?: string;
}

export interface Stream {
  channel: string;
  title: string;
  url: string;
  quality?: string;
  labels?: string[];
}

export interface Guide {
  channel: string;
  site?: string;
  site_name?: string;
  sources?: { url: string }[];
}

export interface PlaylistInfo {
  name: string;
  url: string;
  size_bytes: number;
  modified: number;
}

export interface McpTool {
  name: string;
  description: string;
  operations?: string[];
  hint?: string;
}

export interface LlmProvider {
  name: string;
  base: string;
  port: number;
  models: string[];
}
