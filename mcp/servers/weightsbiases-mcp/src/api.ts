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
