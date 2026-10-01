export class TurboSquidError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TurboSquidError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.turbosquid.com"
const ACCEPT = "application/vnd.api+json; com.turbosquid.api.version=1"

function optAuth(): Record<string, string> {
  const tok = process.env.TURBOSQUID_API_TOKEN
  if (!tok) throw new TurboSquidError("Set the TURBOSQUID_API_TOKEN environment variable (TurboSquid API token).")
  return { Authorization: "Token " + tok }
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: ACCEPT, ...optAuth() } })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new TurboSquidError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listFileFormats(): Promise<string> {
  return req("/api/file_formats")
}

export function getProduct(productId: string): Promise<string> {
  return req(`/api/products/${encodeURIComponent(productId)}`)
}

export function listDrafts(): Promise<string> {
  return req("/api/drafts")
}

export function getDraft(draftId: string): Promise<string> {
  return req(`/api/drafts/${encodeURIComponent(draftId)}`)
}

// ---- muxH tools:
// Every tool above talks to the TurboSquid API, which needs a token. These two ask
// a different question about a genuinely public, keyless 3D asset library: what
// mesh formats real models are actually published in, how big those files are, and
// which freely reusable models exist on a given subject. One GitHub tree request
// answers both, so neither can be rate-limited into failing.

const TS_TREE = "https://api.github.com/repos/nasa/NASA-3D-Resources/git/trees/master?recursive=1";
const TS_UA = "mcfentmen-turbosquid-mcp/1.1 (https://github.com/mcfentmen/turbosquid-mcp)";
const TS_PREFIX = "3D Models/";

/** What each extension is for, and which toolchain consumes it. */
const TS_FORMATS: Record<string, { label: string; use: string }> = {
  stl: { label: "STL", use: "3D printing and slicers" },
  glb: { label: "glTF binary", use: "web, games and real-time viewers" },
  gltf: { label: "glTF", use: "web and games, text form" },
  obj: { label: "OBJ", use: "universal import" },
  fbx: { label: "FBX", use: "DCC interchange, mostly proprietary" },
  blend: { label: "Blender", use: "Blender's own scene format" },
  "3ds": { label: "3ds Max", use: "legacy 3D Studio Max scene" },
  lwo: { label: "Lightwave", use: "legacy Lightwave object" },
  dae: { label: "COLLADA", use: "interchange" },
  ma: { label: "Maya ASCII", use: "Maya scene" },
  mb: { label: "Maya Binary", use: "Maya scene" },
  "3mf": { label: "3MF", use: "3D printing, carries colour and units" },
  amf: { label: "AMF", use: "3D printing" },
  ply: { label: "PLY", use: "scanned meshes" },
  usdz: { label: "USDZ", use: "AR on Apple devices" },
  zip: { label: "zip archive", use: "packaging" },
  "7z": { label: "7-zip archive", use: "packaging" },
  rar: { label: "rar archive", use: "packaging" },
};

const TS_PREVIEW = new Set(["png", "jpg", "jpeg", "webp", "gif", "tif", "tiff", "gifv"]);
const TS_MESH = new Set(["stl", "glb", "gltf", "obj", "fbx", "blend", "3ds", "lwo", "dae", "ma", "mb", "3mf", "amf", "ply", "usdz"]);
const TS_ARCHIVE = new Set(["zip", "7z", "rar"]);

interface TsEntry {
  path: string;
  type: string;
  size?: number;
}
interface TsModel {
  name: string;
  files: { name: string; ext: string; size: number }[];
}

async function tsTree(): Promise<TsEntry[]> {
  let res: Response;
  try {
    res = await fetch(TS_TREE, {
      headers: { "User-Agent": TS_UA, Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(40000),
    });
  } catch (e) {
    throw new TurboSquidError(`Could not reach the public model library: ${(e as Error).message}`);
  }
  if (res.status === 403 || res.status === 429) {
    throw new TurboSquidError("GitHub is rate-limiting this client; the public tree can be read once a minute anonymously.");
  }
  if (!res.ok) throw new TurboSquidError(`The public model library returned HTTP ${res.status}.`);
  const body = (await res.json()) as { tree?: TsEntry[]; truncated?: boolean };
  if (!Array.isArray(body.tree) || !body.tree.length) {
    throw new TurboSquidError("The public model library returned an empty tree.");
  }
  return body.tree;
}

const tsExt = (name: string): string => {
  const m = /\.([A-Za-z0-9]{1,6})$/.exec(name);
  return m ? m[1].toLowerCase() : "";
};

const tsMb = (bytes: number): string =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Group the flat tree into one entry per model directory under "3D Models". */
function tsModels(entries: TsEntry[]): TsModel[] {
  const models = new Map<string, TsModel>();
  for (const entry of entries) {
    if (entry.type !== "blob" || !entry.path.startsWith(TS_PREFIX)) continue;
    const rest = entry.path.slice(TS_PREFIX.length);
    const slash = rest.indexOf("/");
    if (slash < 0) continue;
    const name = rest.slice(0, slash);
    const file = rest.slice(slash + 1);
    if (!file || file.includes("/")) continue;
    const model = models.get(name) ?? { name, files: [] };
    model.files.push({ name: file, ext: tsExt(file), size: entry.size ?? 0 });
    models.set(name, model);
  }
  return [...models.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * What a real, freely published 3D model library is actually made of: which mesh
 * formats carry the models, how large those files are, how many models ship more
 * than one format, and where print-ready and web-ready part company. A format list
 * says what a marketplace claims to accept; this says what gets published.
 */
export async function meshFormatSurvey(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit ?? 12) || 12, 1), 30);
  const models = tsModels(await tsTree());
  if (!models.length) throw new TurboSquidError("The public library published no model directories to survey.");

  const byFormat = new Map<string, { count: number; bytes: number; sizes: number[] }>();
  let meshFiles = 0;
  let meshBytes = 0;
  let previewFiles = 0;
  let archiveFiles = 0;
  for (const model of models) {
    for (const file of model.files) {
      if (TS_MESH.has(file.ext)) {
        meshFiles += 1;
        meshBytes += file.size;
        const slot = byFormat.get(file.ext) ?? { count: 0, bytes: 0, sizes: [] };
        slot.count += 1;
        slot.bytes += file.size;
        slot.sizes.push(file.size);
        byFormat.set(file.ext, slot);
      } else if (TS_PREVIEW.has(file.ext)) previewFiles += 1;
      else if (TS_ARCHIVE.has(file.ext)) archiveFiles += 1;
    }
  }
  if (!meshFiles) throw new TurboSquidError("The public library published no mesh files to survey.");

  const ranked = [...byFormat.entries()].sort((a, b) => b[1].count - a[1].count);
  const max = ranked[0]?.[1].count ?? 1;
  const pct = (n: number, d: number): string => (d ? `${((n / d) * 100).toFixed(0)}%` : "n/a");
  const sortedAll = [...byFormat.values()].flatMap((f) => f.sizes).sort((a, b) => a - b);
  const median = sortedAll.length ? sortedAll[Math.floor(sortedAll.length / 2)] : 0;
  const heaviest = models
    .flatMap((m) => m.files.filter((f) => TS_MESH.has(f.ext)).map((f) => ({ model: m.name, file: f })))
    .sort((a, b) => b.file.size - a.file.size);

  const singleFormat = models.filter((m) => new Set(m.files.filter((f) => TS_MESH.has(f.ext)).map((f) => f.ext)).size <= 1).length;
  const withPreview = models.filter((m) => m.files.some((f) => TS_PREVIEW.has(f.ext))).length;
  const glb = byFormat.get("glb")?.count ?? 0;
  const stl = byFormat.get("stl")?.count ?? 0;

  return [
    "Mesh format survey of a public, freely published 3D model library",
    `  ${models.length} model director(ies), ${meshFiles} mesh file(s) totalling ${tsMb(meshBytes)}`,
    `  plus ${previewFiles} preview image(s) and ${archiveFiles} archive(s), which are not counted as mesh formats`,
    "",
    "Formats, by how many files carry them:",
    ...ranked.map(([ext, stat]) => {
      const sizes = [...stat.sizes].sort((a, b) => a - b);
      const meta = TS_FORMATS[ext];
      return (
        `  ${(meta?.label ?? ext.toUpperCase()).padEnd(16)}${String(stat.count).padStart(5)} file(s)  ${pct(stat.count, meshFiles).padStart(4)} of meshes  ` +
        `total ${tsMb(stat.bytes).padStart(9)}  median ${tsMb(sizes[Math.floor(sizes.length / 2)]).padStart(9)}  ${"".padEnd(1)}` +
        `${meta ? meta.use : "unrecognised extension"}  ${"#".repeat(Math.max(1, Math.round((stat.count / max) * 18)))}`
      );
    }),
    ...(ranked.length > limit ? [`  (+${ranked.length - limit} further format(s) not shown)`] : []),
    "",
    "Shape of the library:",
    `  median mesh file ${tsMb(median)}, range ${tsMb(sortedAll[0])} to ${tsMb(sortedAll[sortedAll.length - 1])}`,
    `  ${singleFormat} of ${models.length} models ship a single mesh format, ${models.length - singleFormat} ship more than one`,
    `  ${withPreview} of ${models.length} models carry a preview image`,
    glb && stl
      ? `  print-ready and web-ready are not the same set: ${stl} STL file(s) for slicers against ${glb} glTF binary file(s) for viewers, so a model that is only STL cannot be dropped into a web page`
      : "  this library publishes one mesh format only, so print and web use do not diverge here",
    "",
    "Largest mesh files:",
    ...heaviest.slice(0, limit).map((row, i) => `  ${String(i + 1).padStart(2)}. ${tsMb(row.file.size).padStart(9)}  ${row.model.slice(0, 52)} (${row.file.name.slice(-24)})`),
    "",
    "Read as: STL dominates because these models are published for printing, glTF binary is present because the same models are republished for browsers, and the two counts are not one-to-one since a model can appear in both. This is a single public repository read in one request, so it is a snapshot; file sizes are what the repository reports, not what any server would deliver after compression. Not affiliated with TurboSquid.",
  ].join("\n");
}

/**
 * Freely reusable models on a given subject, with the real file inventory of each
 * hit: which formats it ships in, how big those files are, and whether a preview
 * exists. Useful when a marketplace search returns only paid assets.
 */
export async function freeModelSearch(args: { query: string; limit?: number }): Promise<string> {
  const query = String(args.query ?? "").trim();
  if (!query) throw new TurboSquidError("Give a subject to search for, for example rover, telescope or spacesuit.");
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30);
  const models = tsModels(await tsTree());
  if (!models.length) throw new TurboSquidError("The public library published no model directories to search.");

  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  const scored = models
    .map((model) => {
      const hay = model.name.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (hay === word) score += 3;
        else if (hay.includes(word)) score += 1;
      }
      return { model, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.model.name.length - b.model.name.length);

  if (!scored.length) {
    const sample = models.slice(0, 12).map((m) => m.name).join("; ");
    return `No model in the public library matches "${query}". It holds ${models.length} model director(ies) named after hardware and missions, for example: ${sample}.`;
  }

  const rows = scored.slice(0, limit).map((entry, i) => {
    const meshes = entry.model.files.filter((f) => TS_MESH.has(f.ext));
    const archive = entry.model.files.find((f) => TS_ARCHIVE.has(f.ext));
    const preview = entry.model.files.find((f) => TS_PREVIEW.has(f.ext));
    const formats = meshes.length
      ? meshes.map((f) => `${TS_FORMATS[f.ext]?.label ?? f.ext.toUpperCase()} ${tsMb(f.size)}`).join(", ")
      : "no mesh file published";
    return [
      `  ${String(i + 1).padStart(2)}. ${entry.model.name}`,
      `      ${formats}${archive ? ` | bundled as ${archive.name}` : ""}${preview ? ` | preview ${tsMb(preview.size)}` : " | no preview"}`,
    ].join("\n");
  });
  const withMesh = scored.filter((e) => e.model.files.some((f) => TS_MESH.has(f.ext))).length;

  return [
    `Freely published models matching "${query}" — ${scored.length} of ${models.length} model director(ies)`,
    `  ${withMesh} of the matches carry an actual mesh file; the rest are directories holding images or archives only`,
    "",
    ...rows,
    ...(scored.length > limit ? [`  (+${scored.length - limit} further match(es) not shown)`] : []),
    "",
    "Matching is on the model's own directory name only, because that is the only text the repository publishes per model; a model described in a readme but not named for the subject will not match. These are freely published files from a public repository, not marketplace listings, and nothing here is affiliated with TurboSquid.",
  ].join("\n");
}
