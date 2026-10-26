export class TurboSquidError extends Error {
    constructor(message) {
        super(message);
        this.name = "TurboSquidError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.turbosquid.com";
const ACCEPT = "application/vnd.api+json; com.turbosquid.api.version=1";
function optAuth() {
    const tok = process.env.TURBOSQUID_API_TOKEN;
    if (!tok)
        throw new TurboSquidError("Set the TURBOSQUID_API_TOKEN environment variable (TurboSquid API token).");
    return { Authorization: "Token " + tok };
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path) {
    const res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: ACCEPT, ...optAuth() } });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new TurboSquidError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function listFileFormats() {
    return req("/api/file_formats");
}
export function getProduct(productId) {
    return req(`/api/products/${encodeURIComponent(productId)}`);
}
export function listDrafts() {
    return req("/api/drafts");
}
export function getDraft(draftId) {
    return req(`/api/drafts/${encodeURIComponent(draftId)}`);
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
const TS_FORMATS = {
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
async function tsTree() {
    let res;
    try {
        res = await fetch(TS_TREE, {
            headers: { "User-Agent": TS_UA, Accept: "application/vnd.github+json" },
            signal: AbortSignal.timeout(40000),
        });
    }
    catch (e) {
        throw new TurboSquidError(`Could not reach the public model library: ${e.message}`);
    }
    if (res.status === 403 || res.status === 429) {
        throw new TurboSquidError("GitHub is rate-limiting this client; the public tree can be read once a minute anonymously.");
    }
    if (!res.ok)
        throw new TurboSquidError(`The public model library returned HTTP ${res.status}.`);
    const body = (await res.json());
    if (!Array.isArray(body.tree) || !body.tree.length) {
        throw new TurboSquidError("The public model library returned an empty tree.");
    }
    return body.tree;
}
const tsExt = (name) => {
    const m = /\.([A-Za-z0-9]{1,6})$/.exec(name);
    return m ? m[1].toLowerCase() : "";
};
const tsMb = (bytes) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
/** Group the flat tree into one entry per model directory under "3D Models". */
function tsModels(entries) {
    const models = new Map();
    for (const entry of entries) {
        if (entry.type !== "blob" || !entry.path.startsWith(TS_PREFIX))
            continue;
        const rest = entry.path.slice(TS_PREFIX.length);
        const slash = rest.indexOf("/");
        if (slash < 0)
            continue;
        const name = rest.slice(0, slash);
        const file = rest.slice(slash + 1);
        if (!file || file.includes("/"))
            continue;
        const model = models.get(name) ?? { name, files: [] };
        model.files.push({ name: file, ext: tsExt(file), size: entry.size ?? 0 });
        models.set(name, model);
    }
    return [...models.values()].sort((a, b) => a.name.localeCompare(b.name));
}
const tsMedian = (values) => {
    if (!values.length)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};
/**
 * What a real public model library is made of: which formats are actually
 * published, how big the files are, and how often a model ships more than one
 * form. Counted from the repository tree, so every number is an observation.
 */
export async function meshFormatSurvey(args) {
    const limit = Math.round(Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 30));
    const tree = await tsTree();
    const models = tsModels(tree);
    if (!models.length)
        throw new TurboSquidError("The public model library tree held no model directories under 3D Models/.");
    const meshFiles = [];
    let withMesh = 0;
    let withPreview = 0;
    let multiFormat = 0;
    let archivedOnly = 0;
    const formats = new Map();
    for (const model of models) {
        const meshes = model.files.filter((f) => TS_MESH.has(f.ext));
        const previews = model.files.filter((f) => TS_PREVIEW.has(f.ext));
        const archives = model.files.filter((f) => TS_ARCHIVE.has(f.ext));
        if (meshes.length)
            withMesh += 1;
        else if (archives.length)
            archivedOnly += 1;
        if (previews.length)
            withPreview += 1;
        const distinct = new Set(meshes.map((m) => m.ext));
        if (distinct.size > 1)
            multiFormat += 1;
        for (const file of meshes) {
            meshFiles.push({ ...file, model: model.name });
            const entry = formats.get(file.ext) ?? { ext: file.ext, files: [], models: new Set() };
            entry.files.push(file.size);
            entry.models.add(model.name);
            formats.set(file.ext, entry);
        }
    }
    if (!meshFiles.length)
        throw new TurboSquidError("The public model library holds no mesh file in any known format; only images or archives are published.");
    const totalMeshBytes = meshFiles.reduce((a, f) => a + f.size, 0);
    const ranked = [...formats.values()].sort((a, b) => b.files.length - a.files.length);
    const largest = [...meshFiles].sort((a, b) => b.size - a.size).slice(0, limit);
    const rows = [
        "Mesh format survey of NASA's public 3D Resources repository (GitHub tree, keyless)",
        `  models            ${models.length} model director(ies), ${meshFiles.length} mesh file(s), ${tsMb(totalMeshBytes)} of mesh data`,
        `  with a mesh       ${withMesh} (${((withMesh / models.length) * 100).toFixed(1)}%)${archivedOnly ? `; ${archivedOnly} publish only an archive, so the mesh is inside a zip` : ""}`,
        `  with a preview    ${withPreview} (${((withPreview / models.length) * 100).toFixed(1)}%) have an image beside the model`,
        `  more than one     ${multiFormat} model(s) ship the same asset in two or more mesh formats`,
        "",
        "  format            files   share   median size   total       models",
        ...ranked.slice(0, limit).map((f) => {
            const total = f.files.reduce((a, n) => a + n, 0);
            return `  ${(TS_FORMATS[f.ext]?.label ?? f.ext.toUpperCase()).padEnd(16)} ${String(f.files.length).padStart(5)}  ${`${((f.files.length / meshFiles.length) * 100).toFixed(1)}%`.padStart(6)}  ${tsMb(tsMedian(f.files)).padStart(12)}  ${tsMb(total).padStart(9)}  ${String(f.models.size).padStart(6)}`;
        }),
        "",
        `Largest mesh files (top ${Math.min(limit, largest.length)}):`,
        ...largest.map((f) => `  ${tsMb(f.size).padStart(9)}  ${(TS_FORMATS[f.ext]?.label ?? f.ext.toUpperCase()).padEnd(14)} ${f.model}/${f.name}`),
        "",
        "note: this counts one public, freely reusable repository (NASA 3D Resources), so the mix is that library's habit rather than the whole market's. Sizes are the git blob sizes; a preview image is strong evidence a model was meant to be looked at, not proof it renders correctly, and the .blend and .ma files carry scenes that may include more than the mesh.",
    ];
    return rows.join("\n");
}
/**
 * Freely reusable models on a given subject, with the real file inventory of each
 * hit: which formats it ships in, how big those files are, and whether a preview
 * exists. Useful when a marketplace search returns only paid assets.
 */
export async function freeModelSearch(args) {
    const query = String(args.query ?? "").trim();
    if (!query)
        throw new TurboSquidError("Give a subject to search for, for example rover, telescope or spacesuit.");
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30);
    const models = tsModels(await tsTree());
    if (!models.length)
        throw new TurboSquidError("The public library published no model directories to search.");
    const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);
    const scored = models
        .map((model) => {
        const hay = model.name.toLowerCase();
        let score = 0;
        for (const word of words) {
            if (hay === word)
                score += 3;
            else if (hay.includes(word))
                score += 1;
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
