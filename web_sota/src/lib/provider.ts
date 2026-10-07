/** Local LLM provider contract (fleet §VI): probe, resident-first resolve, GPU fit. */

export interface Gpu {
  index: number;
  name: string;
  vramMb: number;
}

const PREFERENCE = ["qwen3.8:27b", "gemma4:12b"];

export function fitsTarget(
  model: string,
  gpus: Gpu[],
  targetIndex: number,
): boolean {
  const gpu = gpus.find((g) => g.index === targetIndex);
  if (!gpu) return true;
  const lower = model.toLowerCase();
  const wants27b =
    lower.includes("27b") || lower.includes("32b") || lower.includes("70b");
  if (wants27b && gpu.vramMb < 20000) return false;
  return true;
}

/** Highest-preference model that is already loaded; else highest installed. */
export function pickPreferredModel(
  loaded: string[],
  installed: string[],
): string | null {
  for (const pref of PREFERENCE) {
    const hit = loaded.find((m) =>
      m.toLowerCase().startsWith(pref.split(":")[0]),
    );
    if (hit) return hit;
  }
  for (const pref of PREFERENCE) {
    const hit = installed.find((m) =>
      m.toLowerCase().startsWith(pref.split(":")[0]),
    );
    if (hit) return hit;
  }
  return loaded[0] ?? installed[0] ?? null;
}

export function resolveDefaultModel(
  saved: string | null,
  loaded: string[],
  installed: string[],
  providerModels: string[],
  gpus: Gpu[],
  targetIndex: number,
): string | null {
  const pool = providerModels.length > 0 ? providerModels : installed;
  const fitting = pool.filter((m) => fitsTarget(m, gpus, targetIndex));
  if (saved && fitting.includes(saved)) return saved;
  const resident = pickPreferredModel(
    loaded.filter((m) => fitting.includes(m)),
    fitting,
  );
  return resident ?? fitting[0] ?? null;
}
