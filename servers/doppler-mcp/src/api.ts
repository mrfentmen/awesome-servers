export class DopplerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DopplerError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new DopplerError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("DOPPLER_API_KEY") }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new DopplerError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listProjects(): Promise<string> {
  let url = `https://api.doppler.com/v3/projects`;
  const data = await req(url);
  return pretty(data);
}

export async function listConfigs(project: string): Promise<string> {
  let url = `https://api.doppler.com/v3/configs`;
  const qs = new URLSearchParams();
  qs.append("project", String(project));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function listSecrets(project: string, config: string, secrets?: string): Promise<string> {
  let url = `https://api.doppler.com/v3/configs/config/secrets`;
  const qs = new URLSearchParams();
  qs.append("project", String(project));
  qs.append("config", String(config));
  if (secrets !== undefined) qs.append("secrets", String(secrets));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function downloadSecrets(project: string, config: string, format?: string): Promise<string> {
  let url = `https://api.doppler.com/v3/configs/config/secrets/download`;
  const qs = new URLSearchParams();
  qs.append("project", String(project));
  qs.append("config", String(config));
  if (format !== undefined) qs.append("format", String(format));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxD tools:

/** Doppler secret entries carry `raw` (as set) and `computed` (after fallbacks), which is why a diff needs both. */
interface DopplerSecret { name?: string; raw?: string | null; computed?: string | null; note?: string | null; rawVisibility?: string }

async function dopplerGet<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`https://api.doppler.com/v3${path}`)
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, v)
  return (await req(url.toString())) as T
}

/** Never print a secret value. Names, counts and drift are the point; values are not. */
const dopplerRedact = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "(not set)"
  return "set"
}

export interface ConfigLockArgs {
  project: string;
}

/** Whether each config in a project is locked, which is the control that stops a production secret being edited. */
export async function configLockStatus(args: ConfigLockArgs): Promise<string> {
  const project = String(args.project ?? "").trim()
  if (!project) throw new DopplerError("Provide a project id or name.")
  const configs = await dopplerGet<Record<string, unknown> | unknown[]>("/configs", { project })
  const rows: any[] = Array.isArray(configs) ? configs : ((configs as any)?.configs ?? [])
  if (!rows.length) {
    throw new DopplerError(`No configs found in project ${project}. Check the identifier, and that your token can read this project.`)
  }

  const results: Array<{ name: string; locked: boolean | null; note: string; envs: string[]; error: string }> = []
  for (const c of rows) {
    const name = String(c?.name ?? c?.config ?? "?")
    const envs = Object.entries((c?.environments ?? {}) as Record<string, unknown>)
      .map(([k, v]) => `${k}${(v as any)?.locked === true ? " (locked)" : ""}`)
      .sort()
    try {
      const lock = await dopplerGet<any>(`/configs/${encodeURIComponent(name)}/lock`, { project })
      const body = lock as any
      const info = body?.config ?? body
      results.push({
        name,
        locked: info?.locked === true,
        note: String(info?.note ?? ""),
        envs,
        error: "",
      })
    } catch (e) {
      results.push({ name, locked: null, note: "", envs, error: e instanceof Error ? e.message : String(e) })
    }
  }

  const locked = results.filter((r) => r.locked === true)
  const unlocked = results.filter((r) => r.locked === false)
  const unknown = results.filter((r) => r.locked === null)
  const lines = [
    `Config lock status for project ${project}: ${results.length} config(s)`,
    `${locked.length} locked, ${unlocked.length} unlocked${unknown.length ? `, ${unknown.length} could not be read` : ""}`,
    "",
    `${"config".padEnd(18)}${"lock".padEnd(10)}note`,
  ]
  for (const r of results) {
    const state = r.error ? "error" : r.locked === true ? "LOCKED" : r.locked === false ? "unlocked" : "unknown"
    lines.push(`${r.name.padEnd(18)}${state.padEnd(10)}${r.note || "-"}`)
    if (r.envs.length) lines.push(`${" ".repeat(18)}environments: ${r.envs.join(", ")}`)
    if (r.error) lines.push(`${" ".repeat(18)}${r.error.slice(0, 120)}`)
  }
  lines.push("")
  if (unlocked.length) {
    lines.push(
      `Unlocked config${unlocked.length === 1 ? "" : "s"}: ${unlocked.map((r) => r.name).join(", ")}.`,
      "While a config is unlocked, anyone with write access can change the secrets in it, and the change takes effect immediately. Locking production and staging is the control that stops a routine edit reaching live, and the lock is recorded so you can see who made it.",
    )
  } else if (locked.length === results.length) {
    lines.push("Every config in this project is locked, so secret values cannot be edited through the API until someone unlocks them deliberately.")
  }
  if (unknown.length) {
    lines.push("", `${unknown.length} config(s) returned an error rather than a lock state. A service token scoped to one project can read its configs but not their lock status, so a 403 here means the token lacks the permission rather than that the config is unlocked.`)
  }
  return lines.join("\n")
}

export interface InheritableArgs {
  project: string;
  config: string;
  limit?: number;
}

/** Which secrets cascade out of one config into other configs and environments, which is how a dev value reaches production. */
export async function inheritableSecrets(args: InheritableArgs): Promise<string> {
  const project = String(args.project ?? "").trim()
  const config = String(args.config ?? "").trim()
  if (!project) throw new DopplerError("Provide a project id or name.")
  if (!config) throw new DopplerError("Provide a config name, for example dev or prd.")
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 40) || 40, 1), 200)

  const data = await dopplerGet<any>(`/configs/${encodeURIComponent(config)}/inheritable`, { project })
  const secrets: any[] = Array.isArray(data) ? data : (data?.secrets ?? [])
  if (!secrets.length) {
    return [
      `No inheritable secrets for ${config} in project ${project}.`,
      "",
      "Either nothing in this config can be pushed down, or the inheritable lookup is empty. A secret only inherits when a lower config is in this config's inheritance path, so a config with no children below it has nothing to report.",
    ].join("\n")
  }

  type Row = { name: string; secret: string; note: string; configs: string[]; envs: string[] }
  const rows: Row[] = secrets.map((s) => ({
    name: String(s?.name ?? s?.secretName ?? "?"),
    secret: String(s?.secret ?? s?.key ?? "?"),
    note: String(s?.note ?? ""),
    configs: Array.isArray(s?.inheritableConfigs) ? s.inheritableConfigs.map(String) : [],
    envs: Array.isArray(s?.inheritableEnvironments) ? s.inheritableEnvironments.map(String) : [],
  }))
  const withTargets = rows.filter((r) => r.configs.length || r.envs.length)

  const lines = [
    `Inheritable secrets for ${config} in project ${project}: ${rows.length} secret(s) in this config, ${withTargets.length} of which cascade somewhere`,
    "",
  ]
  const shown = withTargets.length ? withTargets : rows
  for (const r of shown.slice(0, limit)) {
    lines.push(`${r.name}  (${r.secret})`)
    if (r.configs.length) lines.push(`  inherited by config(s): ${r.configs.join(", ")}`)
    if (r.envs.length) lines.push(`  inherited by environment(s): ${r.envs.join(", ")}`)
    if (r.note) lines.push(`  note: ${r.note.slice(0, 140)}`)
  }
  if (shown.length > limit) lines.push(`  ...and ${shown.length - limit} more; raise limit to see them.`)
  if (!withTargets.length) {
    lines.push("", "Nothing in this config cascades, so it is a leaf of the inheritance graph.")
  } else {
    lines.push(
      "",
      "A secret listed here exists in the configs and environments named above without being set in each of them. That is how a single dev value becomes a production value, and it is the first thing to check when a production secret is wrong but development is right.",
    )
  }
  lines.push("", "Values are never read by this tool; it reports names and destinations only.")
  return lines.join("\n")
}

export interface SecretDiffArgs {
  project: string;
  from_config: string;
  to_config: string;
  limit?: number;
}

/** Compares the secrets of two configs and reports drift, without printing any values. */
export async function secretDiff(args: SecretDiffArgs): Promise<string> {
  const project = String(args.project ?? "").trim()
  const from = String(args.from_config ?? "").trim()
  const to = String(args.to_config ?? "").trim()
  if (!project) throw new DopplerError("Provide a project id or name.")
  if (!from || !to) throw new DopplerError("Provide both from_config and to_config, for example dev and prd.")
  if (from === to) throw new DopplerError("from_config and to_config are the same, so there is nothing to compare.")

  const read = async (config: string): Promise<Map<string, DopplerSecret>> => {
    const data = await dopplerGet<any>("/configs/config/secrets", { project, config })
    const rows: any[] = Array.isArray(data) ? data : (data?.secrets ?? (data as any)?.variables ?? [])
    const map = new Map<string, DopplerSecret>()
    for (const s of rows) {
      const name = String(s?.name ?? "")
      if (name) map.set(name, s as DopplerSecret)
    }
    return map
  }

  const [a, b] = await Promise.all([read(from), read(to)])
  if (!a.size && !b.size) {
    return `Neither ${from} nor ${to} returned any secrets in project ${project}. Check the config names, and that your token can read this project's secrets.`
  }

  const all = [...new Set([...a.keys(), ...b.keys()])].sort()
  const onlyInA: string[] = []
  const onlyInB: string[] = []
  const same: string[] = []
  const differ: Array<{ name: string; from: string; to: string; fromRaw: string; toRaw: string }> = []
  for (const name of all) {
    const sa = a.get(name)
    const sb = b.get(name)
    if (sa && !sb) { onlyInA.push(name); continue }
    if (!sa && sb) { onlyInB.push(name); continue }
    if (!sa || !sb) continue
    // computed is the value an app actually receives, so compare that; raw shows
    // whether the difference is a local override or a genuine different value.
    if (sa.computed === sb.computed) same.push(name)
    else differ.push({ name, from: dopplerRedact(sa.computed), to: dopplerRedact(sb.computed), fromRaw: dopplerRedact(sa.raw), toRaw: dopplerRedact(sb.raw) })
  }

  const limit = Math.min(Math.max(Math.floor(args.limit ?? 40) || 40, 1), 200)
  const total = a.size + b.size
  const lines = [
    `Secret diff ${from} -> ${to} in project ${project}: ${a.size} secret(s) in ${from}, ${b.size} in ${to}, ${total} distinct name(s)`,
    `${same.length} identical | ${differ.length} differ | ${onlyInA.length} only in ${from} | ${onlyInB.length} only in ${to}`,
    "",
    `Comparison uses the computed value, which is what an application actually receives after fallbacks are applied. Raw is the value set in that specific config, so a difference in raw but not computed means one config inherits the value rather than setting it.`,
  ]
  if (differ.length) {
    lines.push("", `Differing (${differ.length}):`)
    for (const d of differ.slice(0, limit)) {
      const inherited = d.fromRaw === "(not set)" || d.toRaw === "(not set)"
      lines.push(`  ${d.name}: ${from} ${d.from} -> ${to} ${d.to}${inherited ? "  (one side inherits rather than setting it)" : "  (both set explicitly)"}`)
    }
    if (differ.length > limit) lines.push(`  ...and ${differ.length - limit} more; raise limit to see them.`)
  }
  if (onlyInA.length) {
    lines.push("", `Only in ${from} (${onlyInA.length}): ${onlyInA.slice(0, 20).join(", ")}${onlyInA.length > 20 ? ", ..." : ""}`)
    lines.push(`  A secret present in ${from} but not ${to} is either new in ${from} or has not been added to ${to} yet. If ${to} is production, that is a missing configuration.`)
  }
  if (onlyInB.length) {
    lines.push("", `Only in ${to} (${onlyInB.length}): ${onlyInB.slice(0, 20).join(", ")}${onlyInB.length > 20 ? ", ..." : ""}`)
    lines.push(`  A secret present in ${to} but not ${from} usually means ${from} has not caught up, or the value was set directly in ${to}.`)
  }
  if (!differ.length && !onlyInA.length && !onlyInB.length) {
    lines.push("", "The two configs agree on every secret name and every computed value. There is no drift to explain.")
  }
  if (differ.length) {
    lines.push("", `Use inheritable_secrets on ${from} to see whether any of these differences are caused by inheritance rather than by a deliberate change.`)
  }
  lines.push("", "No secret value is printed by this tool, only whether one is set and whether the two configs agree.")
  return lines.join("\n")
}
