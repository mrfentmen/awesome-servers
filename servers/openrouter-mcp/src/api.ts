export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenRouterError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new OpenRouterError("Set OPENROUTER_API_KEY (free OpenRouter key).");
  return k;
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1" + path, {
      headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${key()}` },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new OpenRouterError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OpenRouterError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listModels(): Promise<string> {
  return get("/models").then((t) => {
    try {
      const d = JSON.parse(t) as { data?: Array<{ id: string; name: string }> };
      return JSON.stringify((d.data ?? []).slice(0, 50).map((m) => ({ id: m.id, name: m.name })), null, 2);
    } catch {
      return t.slice(0, 4000);
    }
  });
}

export function keyInfo(): Promise<string> {
  return get("/auth/key");
}

export function credits(): Promise<string> {
  return get("/credits");
}



interface ORModel { id: string; name: string; context_length?: number; pricing?: { prompt?: string; completion?: string }; }

async function allModels(): Promise<ORModel[]> {
  const t = await listModelsRaw();
  try {
    const d = JSON.parse(t) as { data?: ORModel[] };
    return d.data ?? [];
  } catch {
    return [];
  }
}

async function listModelsRaw(): Promise<string> {
  return get("/models");
}

export async function getModel(modelId: string): Promise<string> {
  const items = await allModels();
  const m = items.find((x) => x.id === modelId);
  if (!m) throw new OpenRouterError(`Model not found: ${modelId}.`);
  return JSON.stringify(m, null, 2);
}

export async function searchModels(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  const q = query.toLowerCase();
  const items = await allModels();
  const hits = items.filter((m) => m.id.toLowerCase().includes(q) || (m.name ?? "").toLowerCase().includes(q)).slice(0, n);
  return JSON.stringify(hits.map((m) => ({ id: m.id, name: m.name })), null, 2);
}

export async function freeModels(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 50);
  const items = await allModels();
  const hits = items.filter((m) => m.id.endsWith(":free")).slice(0, n);
  return JSON.stringify(hits.map((m) => ({ id: m.id, name: m.name })), null, 2);
}

export async function longestContext(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  const items = await allModels();
  items.sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0));
  return JSON.stringify(items.slice(0, n).map((m) => ({ id: m.id, context_length: m.context_length })), null, 2);
}

export function modelEndpoints(author: string, slug: string): Promise<string> {
  return get(`/models/${encodeURIComponent(author)}/${encodeURIComponent(slug)}/endpoints`);
}

export function generationStats(generationId: string): Promise<string> {
  return get(`/generation?id=${encodeURIComponent(generationId)}`);
}

// ---- muxG tools:
const OR_MODELS_URL = "https://openrouter.ai/api/v1/models"
const OR_LIST_CAP = 10

interface OrModel {
  id: string
  name?: string
  context_length?: number
  created?: number
  expiration_date?: string
  knowledge_cutoff?: string
  description?: string
  architecture?: { modality?: string; input_modalities?: string[]; output_modalities?: string[]; tokenizer?: string; instruct_type?: string }
  pricing?: Record<string, string>
  top_provider?: { context_length?: number; max_completion_tokens?: number; is_moderated?: boolean }
  supported_parameters?: string[]
  reasoning?: boolean
  canonical_slug?: string
}

let orModelCache: OrModel[] | null = null

async function orModels(): Promise<OrModel[]> {
  if (orModelCache) return orModelCache
  const res = await fetch(OR_MODELS_URL, {
    headers: { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(40000),
  })
  if (res.status === 401 || res.status === 403) throw new OpenRouterError(`OpenRouter returned ${res.status} for the public model list.`)
  if (!res.ok) throw new OpenRouterError(`OpenRouter returned ${res.status} for the public model list.`)
  const d = (await res.json()) as { data?: OrModel[] }
  if (!Array.isArray(d.data) || !d.data.length) throw new OpenRouterError("OpenRouter returned an empty model list.")
  orModelCache = d.data
  return orModelCache
}

function orBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

/** OpenRouter publishes some placeholder rows whose price is negative, so refuse to bill against them. */
function orPrice(model: OrModel, key: string): number | null {
  const raw = model.pricing?.[key]
  if (raw === undefined || raw === null || raw === "") return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function orPerMillion(n: number): string {
  return `$${(n * 1_000_000).toFixed(n * 1_000_000 < 1 ? 4 : 2)}`
}

function orCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return String(n)
}

function orQuartiles(values: number[]): { p25: number; p50: number; p75: number } {
  const s = [...values].sort((a, b) => a - b)
  const at = (q: number): number => s[Math.min(s.length - 1, Math.floor(s.length * q))]
  return { p25: at(0.25), p50: at(0.5), p75: at(0.75) }
}

function orUsd(n: number): string {
  return n < 0.01 ? `$${n.toFixed(6)}` : n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`
}

function orFindModel(models: OrModel[], wanted: string): OrModel | undefined {
  const q = wanted.trim().toLowerCase()
  return (
    models.find((m) => m.id.toLowerCase() === q) ??
    models.find((m) => m.id.toLowerCase().endsWith(`/${q}`)) ??
    models.find((m) => m.id.toLowerCase().split("/").pop() === q) ??
    models.find((m) => m.canonical_slug?.toLowerCase() === q)
  )
}

/** What a request will actually cost, at the prices OpenRouter publishes right now. */
export async function promptCostEstimate(args: { input_tokens?: number; output_tokens?: number; model?: string; compare?: number }): Promise<string> {
  const inputTokens = orBound(args?.input_tokens, 0, 10_000_000, 1000)
  const outputTokens = orBound(args?.output_tokens, 0, 1_000_000, 500)
  if (inputTokens === 0 && outputTokens === 0) throw new OpenRouterError("input_tokens and output_tokens cannot both be zero.")
  const compare = orBound(args?.compare, 1, OR_LIST_CAP, 5)
  const models = await orModels()

  const wanted = String(args?.model ?? "").trim()
  let chosen: OrModel[]
  if (wanted) {
    const hit = orFindModel(models, wanted)
    if (!hit) throw new OpenRouterError(`OpenRouter does not list a model called "${wanted}". Try its full id, for example anthropic/claude-sonnet-5.5.`)
    chosen = [hit]
  } else {
    const billable = models.filter((m) => orPrice(m, "prompt") !== null && orPrice(m, "completion") !== null)
    chosen = [...billable].sort((a, b) => (orPrice(a, "prompt")! * inputTokens) + (orPrice(a, "completion")! * outputTokens) - ((orPrice(b, "prompt")! * inputTokens) + (orPrice(b, "completion")! * outputTokens))).slice(0, compare)
  }

  const rows = chosen.map((m) => {
    const pin = orPrice(m, "prompt")
    const pout = orPrice(m, "completion")
    const total = (pin ?? 0) * inputTokens + (pout ?? 0) * outputTokens
    const cacheRead = orPrice(m, "input_cache_read")
    const cacheWrite = orPrice(m, "input_cache_write")
    const cached = cacheRead === null ? null : cacheRead * inputTokens
    return { m, pin, pout, total, cacheRead, cacheWrite, cached }
  })

  return [
    `Cost estimate: ${inputTokens.toLocaleString("en-US")} input token(s) and ${outputTokens.toLocaleString("en-US")} output token(s)`,
    wanted ? `Priced against ${wanted} as named.` : `Cheapest ${rows.length} billable model(s) in the OpenRouter catalogue.`,
    "",
    ...rows.map((r) => {
      const lines = [
        `  ${r.m.id} — ${r.m.name ?? r.m.id}`,
        `    prompt ${r.pin === null ? "not billed" : orPerMillion(r.pin)}/M, completion ${r.pout === null ? "not billed" : orPerMillion(r.pout)}/M`,
        `    this request: ${orUsd(r.total)}`,
        r.cacheRead !== null && r.cached !== null
          ? `    with every input token served from cache: ${orUsd(r.cached + (r.pout ?? 0) * outputTokens)}${r.cacheWrite !== null ? ` (writing the cache instead costs ${orUsd(r.cacheWrite * inputTokens + (r.pout ?? 0) * outputTokens)})` : ""}`
          : "    no prompt cache price published for this model",
        `    context ${r.m.context_length ? orCompact(r.m.context_length) : "not reported"}, ${(r.m.supported_parameters ?? []).includes("tools") ? "supports tools" : "no tool calling"}`,
      ]
      return lines.join("\n")
    }),
    "",
    wanted && rows[0]?.pin === null
      ? "That model publishes no positive per-token price, so no cost is shown. A row like this is a placeholder rather than something you can bill against."
      : `These are the list prices. OpenRouter's reported cost for a real request also reflects the upstream provider's own charge, so treat the two as a comparison tool rather than an invoice.`,
  ].join("\n")
}

/** The shape of the catalogue as a market: where prices sit, and what is concentrated. */
export async function modelEconomicsMatrix(_args: Record<string, never>): Promise<string> {
  const models = await orModels()
  const billable = models.filter((m) => orPrice(m, "prompt") !== null && orPrice(m, "completion") !== null)
  if (!billable.length) throw new OpenRouterError("OpenRouter published no model with a usable per-token price.")

  const promptPrices = billable.map((m) => orPrice(m, "prompt")!)
  const completionPrices = billable.map((m) => orPrice(m, "completion")!)
  const pq = orQuartiles(promptPrices)
  const cq = orQuartiles(completionPrices)

  const byProvider = new Map<string, number>()
  const byContext = new Map<string, number>()
  const byModality = new Map<string, number>()
  let reasoning = 0
  let tools = 0
  let vision = 0
  for (const m of models) {
    const provider = m.id.split("/")[0] ?? "not reported"
    byProvider.set(provider, (byProvider.get(provider) ?? 0) + 1)
    const ctx = m.context_length ?? 0
    const bucket = ctx >= 1_000_000 ? "1M or more" : ctx >= 200_000 ? "200k-1M" : ctx >= 100_000 ? "100k-200k" : ctx >= 32_000 ? "32k-100k" : ctx > 0 ? "under 32k" : "not reported"
    byContext.set(bucket, (byContext.get(bucket) ?? 0) + 1)
    const inputs = (m.architecture?.input_modalities ?? []).join("+") || "text only"
    byModality.set(inputs, (byModality.get(inputs) ?? 0) + 1)
    if (m.reasoning) reasoning += 1
    if ((m.supported_parameters ?? []).includes("tools")) tools += 1
    if ((m.architecture?.input_modalities ?? []).includes("image")) vision += 1
  }

  const rank = <K,>(m: Map<K, number>, n = OR_LIST_CAP): [K, number][] => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
  const cheapest = [...billable].sort((a, b) => orPrice(a, "prompt")! - orPrice(b, "prompt")!).slice(0, 5)
  const dearest = [...billable].sort((a, b) => orPrice(b, "prompt")! - orPrice(a, "prompt")!).slice(0, 3)
  const newest = [...models].filter((m) => m.created).sort((a, b) => (b.created ?? 0) - (a.created ?? 0)).slice(0, 5)

  return [
    `OpenRouter catalogue economics: ${models.length} models, ${billable.length} with a usable per-token price`,
    "",
    `Prompt price per million tokens: 25th percentile ${orPerMillion(pq.p25)}, median ${orPerMillion(pq.p50)}, 75th percentile ${orPerMillion(pq.p75)}`,
    `Completion price per million tokens: 25th percentile ${orPerMillion(cq.p25)}, median ${orPerMillion(cq.p50)}, 75th percentile ${orPerMillion(cq.p75)}`,
    "",
    `Capability mix: ${tools} model(s) support tool calling, ${reasoning} are flagged as reasoning models, ${vision} accept image input`,
    "",
    "Cheapest prompt price:",
    ...cheapest.map((m) => `  ${orPerMillion(orPrice(m, "prompt")!).padStart(11)}/M  ${m.id}  (completion ${orPerMillion(orPrice(m, "completion")!)})`),
    "",
    "Most expensive prompt price:",
    ...dearest.map((m) => `  ${orPerMillion(orPrice(m, "prompt")!).padStart(11)}/M  ${m.id}  (completion ${orPerMillion(orPrice(m, "completion")!)})`),
    "",
    "Context length, all models:",
    ...rank(byContext, 5).map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`),
    "",
    `Provider prefixes (${byProvider.size} of them), largest first:`,
    ...rank(byProvider, 8).map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`),
    "",
    "Input modality mix:",
    ...rank(byModality, 6).map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`),
    "",
    "Newest entries in the catalogue:",
    ...newest.map((m) => `  ${new Date((m.created ?? 0) * 1000).toISOString().slice(0, 10)}  ${m.id}`),
    "",
    "A median prompt price far below the 75th percentile means a long tail of very cheap models drags the middle down, so the median is a poor basis for a budget. The 75th percentile is the number to plan against.",
  ].join("\n")
}

/** Which models are being retired, and how fresh the catalogue actually is. */
export async function deprecationWatch(args: { limit?: number }): Promise<string> {
  const limit = orBound(args?.limit, 1, OR_LIST_CAP, 8)
  const models = await orModels()
  const expiring = models
    .filter((m) => m.expiration_date)
    .map((m) => ({ m, days: Math.round((Date.parse(m.expiration_date as string) - Date.now()) / 86400000) }))
    .sort((a, b) => a.days - b.days)

  const cutoffs = models.map((m) => m.knowledge_cutoff).filter(Boolean) as string[]
  const now = new Date()
  const cutoffCounts = new Map<string, number>()
  for (const c of cutoffs) {
    const year = c.slice(0, 4)
    cutoffCounts.set(year, (cutoffCounts.get(year) ?? 0) + 1)
  }
  const oldest = cutoffs.slice().sort()[0] ?? "not reported"
  const stale = cutoffs.filter((c) => Date.parse(`${c}-01-01`) < Date.parse(`${now.getFullYear() - 1}-01-01`)).length

  return [
    `Deprecation watch over ${models.length} models: ${expiring.length} carry an expiration date`,
    expiring.length
      ? `Soonest first: ${expiring.slice(0, limit).map((e) => `${e.m.id} on ${String(e.m.expiration_date).slice(0, 10)} (${e.days < 0 ? `${Math.abs(e.days)} day(s) ago` : `${e.days} day(s) left`})`).join("; ")}`
      : "No model in the catalogue currently announces a retirement date.",
    expiring.filter((e) => e.days < 0).length
      ? `${expiring.filter((e) => e.days < 0).length} of them are past their expiration date and are still listed, so the date is a signal rather than a hard cut-off.`
      : "",
    "",
    "Knowledge cutoffs across the catalogue:",
    `  earliest reported cutoff ${String(oldest).slice(0, 10)}`,
    `  ${stale} model(s) declare a cutoff more than a year old`,
    ...[...cutoffCounts.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6).map(([year, n]) => `  ${year}  ${String(n).padStart(4)} model(s)`),
    "",
    "A knowledge cutoff is the model's training horizon, not the date of the weights on the wire: providers keep serving a model long after a newer one appears, and a cutoff alone tells you nothing about retrieval or tool use.",
    expiring.length
      ? "Before you build against a model with an expiration date, check whether the provider offers a replacement and whether the two are prompt-compatible; a silent swap mid-project is the expensive failure."
      : "",
  ].filter(Boolean).join("\n")
}
