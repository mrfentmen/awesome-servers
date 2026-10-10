/**
 * Weights & Biases GraphQL client. Needs WANDB_API_KEY
 * (free at https://wandb.ai/settings, User Settings > API keys).
 * Docs: https://docs.wandb.ai/ref/query-panel/
 */
const API = "https://api.wandb.ai/graphql"

export class WandbError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function gql<T>(query: string, variables: Raw = {}): Promise<T> {
  const key = process.env.WANDB_API_KEY
  if (!key) throw new WandbError("Set WANDB_API_KEY first (free at wandb.ai/settings).")
  const res = await fetch(API, {
    method: "POST",
    headers: { "User-Agent": "weightsbiases-mcp/1.0", "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new WandbError("W&B refused (401/403). Check WANDB_API_KEY.")
  if (!res.ok) throw new WandbError(`W&B error ${res.status}`)
  const data = (await res.json()) as Raw
  if (data.errors) throw new WandbError(`W&B: ${String(data.errors[0]?.message ?? "query failed").slice(0, 200)}`)
  return data.data as T
}

export interface Profile {
  username?: string
  email?: string
}

export async function myProfile(): Promise<Profile> {
  const data = await gql<Raw>("{ viewer { username email } }")
  const v: Raw = data.viewer ?? {}
  return { username: v.username, email: v.email }
}

export interface Project {
  name: string
  entity?: string
}

export async function listProjects(entity: string, limit = 10): Promise<Project[]> {
  if (!entity.trim()) throw new WandbError("Entity (username or team) is empty.")
  const data = await gql<Raw>(
    `query($entity: String!, $n: Int!) {
      user(username: $entity) { projects(first: $n) { edges { node { name entityName } } } }
    }`,
    { entity: entity.trim(), n: Math.min(Math.max(limit, 1), 50) }
  )
  const edges: Raw[] = data.user?.projects?.edges ?? []
  return edges.slice(0, limit).map((e) => ({ name: String(e.node?.name ?? "?"), entity: e.node?.entityName }))
}

export interface Run {
  name?: string
  state?: string
  created?: string
}

export async function listRuns(entity: string, project: string, limit = 5): Promise<Run[]> {
  if (!entity.trim() || !project.trim()) throw new WandbError("Entity and project are required.")
  const data = await gql<Raw>(
    `query($entity: String!, $project: String!, $n: Int!) {
      project(entityName: $entity, name: $project) {
        runs(first: $n, order: "-created_at") { edges { node { name state createdAt } } }
      }
    }`,
    { entity: entity.trim(), project: project.trim(), n: Math.min(Math.max(limit, 1), 20) }
  )
  const edges: Raw[] = data.project?.runs?.edges ?? []
  if (!data.project) throw new WandbError(`No project "${project}" for "${entity}".`)
  return edges.slice(0, limit).map((e) => ({
    name: e.node?.name,
    state: e.node?.state,
    created: e.node?.createdAt ? String(e.node.createdAt).slice(0, 10) : undefined,
  }))
}

// ---- muxH tools:
// All three tools above call Weights & Biases' GraphQL API with an account token
// and report the caller's own runs and projects. These two need no token: they
// read the public model and dataset indexes, which is where the metadata a training
// run is compared against actually comes from.

const WB_HF = "https://huggingface.co/api";
const WB_HF_UA = "mcfentmen-weightsbiases-mcp/1.2 (contactae2000@gmail.com)";

interface WbHfModel {
  id?: string;
  modelId?: string;
  author?: string;
  pipeline_tag?: string;
  library_name?: string;
  tags?: string[];
  downloads?: number;
  likes?: number;
  lastModified?: string;
  createdAt?: string;
  gated?: boolean | string;
  private?: boolean;
  disabled?: boolean;
  mask_token?: string;
  cardData?: {
    license?: string | string[];
    language?: string | string[];
    datasets?: string[];
    task_categories?: string[];
    model_name?: string;
    library_name?: string;
    base_model?: string[];
    metrics?: string[];
  };
  safetensors?: { total?: number; parameters?: Record<string, number> };
  siblings?: { rfilename?: string; size?: number }[];
}
interface WbHfDataset {
  id?: string;
  author?: string;
  downloads?: number;
  likes?: number;
  lastModified?: string;
  createdAt?: string;
  gated?: boolean | string;
  private?: boolean;
  disabled?: boolean;
  tags?: string[];
  cardData?: { license?: string | string[]; language?: string | string[]; task_categories?: string[]; pretty_name?: string; configs?: { config_name?: string; data_files?: unknown }[] };
}

async function wbHfGet<T>(path: string, label: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${WB_HF}${path}`, { headers: { "User-Agent": WB_HF_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
  } catch (e) {
    throw new Error(`Could not reach the public model index: ${(e as Error).message}`);
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error(`${label} is gated and needs a Hugging Face token. The public index carries no credential here, so a gated repository cannot be read.`);
  }
  if (res.status === 404) throw new Error(`${label} is not in the public index.`);
  if (!res.ok) throw new Error(`${label} returned HTTP ${res.status}.`);
  return (await res.json()) as T;
}

const wbList = (value?: string | string[]): string => {
  if (!value) return "not declared";
  return Array.isArray(value) ? value.join(", ") : value;
};
const wbBn = (n?: number): string => {
  if (!n || !Number.isFinite(n)) return "not reported";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

/**
 * What a public model actually declares: the licence, the datasets it was trained
 * on, its parameter count and precision, the task it is meant for, and how much
 * use it has had. A run tracker records what you trained; this records what the
 * checkpoint says about itself, which is what makes two runs comparable.
 */
export async function modelCardAudit(args: { model: string; siblings?: number }): Promise<string> {
  const id = String(args?.model ?? "").trim().replace(/^https?:\/\/huggingface\.co\//, "").replace(/\/$/, "");
  if (!id) throw new Error("Give a model id such as google-bert/bert-base-uncased, or the model page URL.");
  const siblingLimit = Math.min(Math.max(Number(args?.siblings ?? 6) || 6, 0), 20);

  // The slash between owner and repository has to stay a path separator:
  // the index answers 400 to an id with it percent-encoded.
  const path = id.split("/").map((part) => encodeURIComponent(part)).join("/");
  const model = await wbHfGet<WbHfModel>(`/models/${path}`, `The model ${id}`);
  const card = model.cardData ?? {};
  const total = model.safetensors?.total;
  const precision = model.safetensors?.parameters ?? {};
  const precisionList = Object.entries(precision)
    .sort((a, b) => b[1] - a[1])
    .map(([dtype, n]) => `${dtype} ${wbBn(n)}`);

  const files = (model.siblings ?? []).map((s) => s.rfilename ?? "").filter(Boolean);
  const weights = files.filter((f) => /\.(safetensors|bin|pt|pth|h5|onnx|msgpack)$/i.test(f));
  const configs = files.filter((f) => /config\.json$/i.test(f));
  const gated = model.gated === true || typeof model.gated === "string" ? model.gated : false;
  const declared = card.datasets ?? [];

  const lines = [
    `Model card for ${model.id ?? id}`,
    `  ${wbBn(model.downloads)} downloads | ${wbBn(model.likes)} likes | last modified ${String(model.lastModified ?? "not reported").slice(0, 10)}`,
    `  pipeline: ${model.pipeline_tag ?? "not declared"} | library: ${model.library_name ?? card.library_name ?? "not declared"}`,
    `  repository: ${model.private ? "private" : "public"}${gated ? `, gated (${typeof gated === "string" ? gated : "access required"})` : ", not gated"}${model.disabled ? ", disabled" : ""}`,
    "",
    "Declared in the card:",
    `  licence: ${wbList(card.license)}`,
    `  language: ${wbList(card.language)}`,
    `  task categories: ${wbList(card.task_categories)}`,
    `  base model: ${wbList(card.base_model)}`,
    `  trained on: ${declared.length ? declared.join(", ") : "no dataset declared, which is the single biggest gap in a card"}`,
    ...(card.metrics?.length ? [`  metrics reported: ${card.metrics.join(", ")}`] : []),
    "",
    "Weights:",
    `  parameter count: ${total ? wbBn(total) : "not reported, the index carries no safetensors summary for this repository"}`,
    ...(precisionList.length ? [`  by precision: ${precisionList.join(", ")}`] : []),
    `  weight files: ${weights.length ? weights.slice(0, siblingLimit).join(", ") : "none found in the file list"}${weights.length > siblingLimit ? ` (+${weights.length - siblingLimit} more)` : ""}`,
    `  config files: ${configs.length ? configs.join(", ") : "none found"}`,
    `  repository holds ${files.length} file(s) in total`,
    "",
    `Tags (${(model.tags ?? []).length}): ${(model.tags ?? []).slice(0, 14).join(", ") || "none"}`,
  ];

  if (siblingLimit > 0) {
    const author = model.author ?? String(model.id ?? id).split("/")[0];
    if (author) {
      try {
        const others = await wbHfGet<WbHfModel[]>(`/models?author=${encodeURIComponent(author)}&sort=downloads&direction=-1&limit=${siblingLimit + 1}`, "The author's other models");
        const mine = others.filter((m) => m.id !== model.id).slice(0, siblingLimit);
        if (mine.length) {
          lines.push("", `Other public models by ${author}:`);
          lines.push(...mine.map((m, i) => `  ${String(i + 1).padStart(2)}. ${m.id?.padEnd(44)}${wbBn(m.downloads).padStart(9)} downloads  ${wbBn(m.likes).padStart(6)} likes  ${String(m.lastModified ?? "?").slice(0, 10)}  ${m.pipeline_tag ?? "pipeline not declared"}`));
        }
      } catch {
        lines.push("", "The author's other models could not be listed, which the index does not always allow.");
      }
    }
  }

  lines.push(
    "",
    "Read this before trusting the card: a licence field is what the author typed, not a verified grant, and a model with no declared training dataset is one whose provenance nobody has recorded. The parameter count comes from the safetensors index and covers only the weights stored in that format, so a repository with no safetensors file reports nothing rather than an estimate. Download counts are the index's own lifetime totals, not a measure of quality.",
  );
  return lines.join("\n");
}

/**
 * The public dataset index: what exists for a subject, how much it is used, and
 * what each entry declares about itself. A training run is only reproducible if
 * the dataset behind it can be named, and this is the place to look it up.
 */
export async function datasetCatalogue(args: { query: string; limit?: number }): Promise<string> {
  const query = String(args?.query ?? "").trim();
  if (!query) throw new Error("Give a subject to search for, for example sentiment, medical or code.");
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);

  const rows = await wbHfGet<WbHfDataset[]>(`/datasets?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=${limit}`, `datasets matching "${query}"`);
  if (!rows.length) {
    return `The public dataset index holds nothing matching "${query}". Search is a substring match on the repository id, so a name, an author or a topic all behave differently here.`;
  }

  const gated = rows.filter((d) => d.gated).length;
  const withLicence = rows.filter((d) => d.cardData?.license).length;
  const total = rows.reduce((sum, d) => sum + (d.downloads ?? 0), 0);
  const authors = new Set(rows.map((d) => d.author ?? d.id?.split("/")[0] ?? "?").filter(Boolean));
  const dates = rows.map((d) => String(d.lastModified ?? "").slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

  return [
    `Public datasets matching "${query}" — ${rows.length} of ${rows.length} returned`,
    `  by ${authors.size} author(s) | ${wbBn(total)} downloads across them | ${gated} gated, ${withLicence} declaring a licence`,
    dates.length ? `  last modified between ${dates[0]} and ${dates[dates.length - 1]}` : "  no modification dates",
    "",
    ...rows.map((d, i) => {
      const card = d.cardData ?? {};
      const tags = (d.tags ?? []).filter((t) => !t.startsWith("region:") && !t.startsWith("size_categories:")).slice(0, 6);
      return [
        `  ${String(i + 1).padStart(2)}. ${(d.id ?? "?").slice(0, 52).padEnd(52)} ${wbBn(d.downloads).padStart(9)} dl  ${wbBn(d.likes).padStart(7)} likes`,
        `      licence ${wbList(card.license).slice(0, 40)} | language ${wbList(card.language).slice(0, 30)} | configs ${card.configs?.length ?? "not reported"} | updated ${String(d.lastModified ?? "?").slice(0, 10)}${d.gated ? " | GATED" : ""}${d.private ? " | private" : ""}`,
        ...(tags.length ? [`      tags: ${tags.join(", ")}`] : []),
      ].join("\n");
    }),
    "",
    "Read as: a dataset card is written by whoever uploaded the repository, so a declared licence or language list is a claim rather than a guarantee, and download totals are lifetime index counts that say nothing about quality or suitability. A gated entry has terms attached that this tool cannot see and cannot accept, and a repository with no licence declared is not automatically free to use.",
  ].join("\n");
}
