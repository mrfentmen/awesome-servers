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
