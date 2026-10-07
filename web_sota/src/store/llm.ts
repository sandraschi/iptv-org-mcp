import { create } from "zustand";
import { api } from "@/lib/api";
import type { Gpu } from "@/lib/provider";
import { resolveDefaultModel } from "@/lib/provider";

interface ProviderState {
  name: string;
  base: string;
  port: number;
  models: string[];
}

interface LlmState {
  providers: ProviderState[];
  status: Record<string, "probing" | "detected" | "not_found">;
  gpus: Gpu[];
  targetGpuIndex: number;
  selectedProvider: string;
  selectedModel: string;
  availableModels: string[];
  loadedModels: string[];
  probed: boolean;
  probe: () => Promise<void>;
  setProvider: (name: string) => void;
  setModel: (model: string) => void;
  setTargetGpu: (index: number) => void;
}

export const useLlm = create<LlmState>((set, get) => ({
  providers: [],
  status: {},
  gpus: [],
  targetGpuIndex: Number(localStorage.getItem("llm_gpu") ?? -1),
  selectedProvider: localStorage.getItem("llm_provider") ?? "",
  selectedModel: localStorage.getItem("llm_model") ?? "",
  availableModels: [],
  loadedModels: [],
  probed: false,
  probe: async () => {
    set({
      status: { ollama: "probing", lmstudio: "probing", vllm: "probing" },
    });
    let providers: ProviderState[] = [];
    try {
      const res = await api<{
        success: boolean;
        data: { providers: ProviderState[] };
      }>("/api/llm/discover");
      providers = res.data.providers;
    } catch {
      providers = [];
    }
    const status: Record<string, "probing" | "detected" | "not_found"> = {
      ollama: "not_found",
      lmstudio: "not_found",
      vllm: "not_found",
    };
    for (const p of providers) status[p.name] = "detected";

    let gpus: Gpu[] = [];
    try {
      const g = await api<{ success: boolean; data: { gpus: Gpu[] } }>(
        "/api/llm/gpus",
      );
      gpus = g.data.gpus;
    } catch {
      gpus = [];
    }
    let target = get().targetGpuIndex;
    if (gpus.length > 1 && !gpus.some((g) => g.index === target)) {
      target = Math.max(...gpus.map((g) => g.index));
      localStorage.setItem("llm_gpu", String(target));
    } else if (gpus.length <= 1) {
      target = gpus[0]?.index ?? 0;
    }

    let loaded: string[] = [];
    let installed: string[] = [];
    try {
      const s = await api<{
        success: boolean;
        data: { loaded: string[]; installed: string[] };
      }>("/api/llm/ollama_state");
      loaded = s.data.loaded;
      installed = s.data.installed;
    } catch {
      loaded = [];
      installed = [];
    }

    const savedProvider = localStorage.getItem("llm_provider");
    const detected = providers.length > 0 ? providers : [];
    const active =
      detected.find((p) => p.name === savedProvider) ??
      detected.find((p) => p.name === "ollama") ??
      detected[0];
    const providerModels = active?.models.length ? active.models : installed;
    const model = resolveDefaultModel(
      localStorage.getItem("llm_model"),
      loaded,
      installed,
      providerModels,
      gpus,
      target,
    );
    if (active) localStorage.setItem("llm_provider", active.name);
    if (model) localStorage.setItem("llm_model", model);
    set({
      providers: detected,
      status,
      gpus,
      targetGpuIndex: target,
      selectedProvider: active?.name ?? "",
      selectedModel: model ?? "",
      availableModels: providerModels,
      loadedModels: loaded,
      probed: true,
    });
  },
  setProvider: (name) => {
    const p = get().providers.find((x) => x.name === name);
    localStorage.setItem("llm_provider", name);
    localStorage.setItem("llm_model", p?.models[0] ?? "");
    set({
      selectedProvider: name,
      selectedModel: p?.models[0] ?? "",
      availableModels: p?.models ?? [],
    });
  },
  setModel: (model) => {
    localStorage.setItem("llm_model", model);
    set({ selectedModel: model });
  },
  setTargetGpu: (index) => {
    localStorage.setItem("llm_gpu", String(index));
    set({ targetGpuIndex: index });
  },
}));
