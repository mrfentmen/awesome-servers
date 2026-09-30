/**
 * Reactome ContentService client, keyless.
 * Docs: https://reactome.org/dev/content-service
 */
const BASE = "https://reactome.org/ContentService"

export class ReactomeError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "reactome-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new ReactomeError("Not found in Reactome.")
  if (!res.ok) throw new ReactomeError(`Reactome error ${res.status}`)
  return (await res.json()) as T
}

const clean = (s: unknown, max: number): string | undefined => {
  if (typeof s !== "string" || !s) return undefined
  const t = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  return t ? (t.length > max ? t.slice(0, max) + "..." : t) : undefined
}

export interface PathwayHit {
  stId: string
  name: string
  type?: string
  species: string[]
  summary?: string
}

export async function searchPathways(query: string, limit = 5): Promise<PathwayHit[]> {
  const data = await getJson<Raw>(`/search/query?query=${encodeURIComponent(query)}`)
  const hits: Raw[] = [];
  for (const r of data.results ?? []) for (const e of r.entries ?? []) hits.push(e)
  return hits.slice(0, limit).map((e) => ({
    stId: String(e.stId ?? e.id ?? "?"),
    name: clean(e.name, 120) ?? "?",
    type: e.exactType || e.type,
    species: Array.isArray(e.species) ? e.species.map(String) : [],
    summary: clean(e.summation, 220),
  }))
}

export interface PathwayDetails {
  stId: string
  name?: string
  species?: string
  summary?: string
  compartments: string[]
  literature: string[]
}

export async function getPathway(stId: string): Promise<PathwayDetails | null> {
  const cleanId = stId.trim().toUpperCase()
  if (!/^R-[A-Z]{3}-\d+/.test(cleanId)) {
    throw new ReactomeError(`Not a Reactome stable id: "${stId}". Use search_pathways to find one (e.g. R-HSA-109581).`)
  }
  const p = await getJson<Raw>(`/data/query/enhanced/${cleanId}`)
  if (!p || p.stId === undefined) return null
  const comps: Raw[] = Array.isArray(p.compartment) ? p.compartment : p.compartment ? [p.compartment] : []
  const lit: Raw = p.literatureReference ?? {}
  const refs: Raw[] = Array.isArray(lit) ? lit : lit.references ?? []
  return {
    stId: String(p.stId ?? cleanId),
    name: clean(p.displayName ?? p.name, 140),
    species: p.speciesName ? String(p.speciesName) : undefined,
    summary: clean(p.summation, 600),
    compartments: comps.map((c) => String(c.displayName ?? c.name ?? c)).slice(0, 8),
    literature: refs.map((r) => String(r.displayName ?? r.title ?? r)).slice(0, 5),
  }
}

export function formatHit(h: PathwayHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const sp = h.species.length ? ` [${h.species.slice(0, 2).join(", ")}]` : ""
  return `${prefix}[${h.stId}] ${h.name}${h.type ? ` (${h.type})` : ""}${sp}${h.summary ? `\n   ${h.summary}` : ""}`
}

export function formatPathway(p: PathwayDetails): string {
  const lines = [
    `[${p.stId}] ${p.name ?? "(unnamed)"}`,
    p.species ? `Species: ${p.species}` : "",
    p.summary ? `Summary: ${p.summary}` : "",
    p.compartments.length ? `Compartments: ${p.compartments.join(", ")}` : "",
    p.literature.length ? `Literature:\n- ${p.literature.join("\n- ")}` : "",
    `Diagram: https://reactome.org/PathwayBrowser/#/${p.stId}`,
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxE tools:
// The two existing tools return one pathway's own name, species, summary,
// compartments and literature. They never touch the three things that describe
// what a pathway is actually made of: the events inside it, the molecules
// taking part, and the shape of the sub-pathway tree above and below it. Those
// are three other routes on the same keyless service, all verified live.
// This block is spliced into the same module, so BASE, Raw, getJson,
// ReactomeError and the clean helper are already in scope and are not
// redeclared or imported again here.

// A stable id, checked the same way the existing tool checks it so a typo is
// refused before a request is made rather than after.
function stid(raw: unknown): string {
  const id = String(raw ?? "").trim().toUpperCase();
  if (!/^R-[A-Z]{3}-\d+/.test(id)) {
    throw new ReactomeError(`Not a Reactome stable id: "${raw}". Use search_pathways to find one (e.g. R-HSA-109581).`);
  }
  return id;
}

const text = (v: unknown, max: number): string => {
  if (typeof v !== "string" || !v) return "";
  const t = v.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
};

// Counts a field across rows. It has to cope with booleans, which is why
// isInferred and isInDisease read cleanly, and with strings, which is why
// schemaClass does too: the first version only tested for true and false and
// so reported every event class as "not set".
function count(rows: Raw[], field: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    const v = r[field];
    const k = v === true ? "true" : v === false ? "false" : v === undefined || v === null || v === "" ? "not set" : String(v);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

const sorted = (m: Map<string, number>): Array<[string, number]> => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

const pct = (n: number, total: number): string => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "n/a");

export interface PathwayStructureArgs {
  stId: string;
}

export async function pathway_structure(args: PathwayStructureArgs): Promise<string> {
  const id = stid(args?.stId);
  const raw = await getJson<unknown>(`/data/pathway/${id}/containedEvents`);
  if (!Array.isArray(raw)) throw new ReactomeError("Reactome did not return a list of contained events.");
  // The route mixes full event objects with bare database ids for events it
  // has no detail for, and silently dropping the bare ones would understate
  // the pathway, so they are counted and named separately.
  const events = raw.filter((x): x is Raw => !!x && typeof x === "object");
  const bare = raw.filter((x): x is number => typeof x === "number");
  if (!events.length && !bare.length) return `Reactome reports no contained events for ${id}.`;
  const byClass = sorted(count(events, "schemaClass"));
  const inferred = count(events, "isInferred");
  const disease = count(events, "isInDisease");
  const lines = [
    `What is inside ${id}, from Reactome's contained-events route:`,
    `  entries returned: ${raw.length}, of which ${events.length} carry detail and ${bare.length} are a bare database id with no object behind them.`,
    `  by event class: ${byClass.map(([k, n]) => `${k} (${n})`).join(", ")}.`,
  ];
  const reactions = byClass.find(([k]) => k === "Reaction")?.[1] ?? 0;
  const subPathways = byClass.find(([k]) => k === "Pathway")?.[1] ?? 0;
  const blackBox = byClass.find(([k]) => k === "BlackBoxEvent")?.[1] ?? 0;
  lines.push(
    `  so ${reactions} chemical reaction${reactions === 1 ? "" : "s"}, ${subPathways} nested sub-pathway${subPathways === 1 ? "" : "s"} and ${blackBox} black box event${blackBox === 1 ? "" : "s"} where Reactome records that something happens without saying what.`,
  );
  if (subPathways) {
    const ratio = reactions / subPathways;
    lines.push(
      `  that is ${ratio.toFixed(1)} reaction${ratio === 1 ? "" : "s"} per sub-pathway, which says whether this is a broad theme holding together detailed modules (a low number) or a thin wrapper over a few modules (a high one).`,
    );
  }
  const inferredTrue = inferred.get("true") ?? 0;
  lines.push(`  curation: isInferred is ${[...inferred.entries()].map(([k, n]) => `${k} (${n})`).join(", ")}.`);
  if (inferredTrue) {
    lines.push(`  ${inferredTrue} of ${events.length} events (${pct(inferredTrue, events.length)}) are computationally inferred rather than curated from literature, so treat them as predictions.`);
  } else {
    lines.push("  nothing in this pathway is marked as computationally inferred, so every event is curated.");
  }
  lines.push(`  disease annotation: isInDisease is ${[...disease.entries()].map(([k, n]) => `${k} (${n})`).join(", ")}.`);
  if ((disease.get("true") ?? 0) === 0) lines.push("  none of these events is flagged as disease related.");
  if (bare.length) {
    lines.push(`  the bare database ids, which Reactome will not expand on this route: ${bare.join(", ")}.`);
  }
  const subs = events.filter((e) => e.schemaClass === "Pathway");
  if (subs.length) {
    lines.push("");
    lines.push("  the nested sub-pathways:");
    for (const s of subs.slice(0, 20)) {
      const flags = [s.isInferred ? "inferred" : "", s.isInDisease ? "disease" : ""].filter(Boolean).join(", ");
      lines.push(`    ${s.stId ?? "?"} ${text(s.displayName, 70)}${flags ? ` (${flags})` : ""}`);
    }
    if (subs.length > 20) lines.push(`    and ${subs.length - 20} further sub-pathway(s).`);
  }
  lines.push("");
  lines.push("  The existing get_pathway reports this pathway's own name and summary and nothing about any of this.");
  return lines.join("\n");
}

export interface PathwayParticipantsArgs {
  stId: string;
  limit?: number;
}

export interface PathwayTreeArgs {
  stId: string;
  maxDepth?: number;
}

interface Node {
  stId: string;
  name: string;
  depth: number;
  maxDepth: number;
  species?: string;
  hasDiagram?: boolean;
  isInferred?: boolean;
  isInDisease?: boolean;
  children: Node[];
}

// ---- gap3a tools:

export interface IdentifierPathwayArgs {
  resource: string;
  identifier: string;
  limit?: number;
}

// Reactome's mapping route takes the resource as a free name and ignores its
// case, so "UniProt", "uniprot" and "UNIPROT" all reach the same database.

