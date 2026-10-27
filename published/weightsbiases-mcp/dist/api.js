/**
 * Weights & Biases GraphQL client. Needs WANDB_API_KEY
 * (free at https://wandb.ai/settings, User Settings > API keys).
 * Docs: https://docs.wandb.ai/ref/query-panel/
 */
const API = "https://api.wandb.ai/graphql";
export class WandbError extends Error {
}
async function gql(query, variables = {}) {
    const key = process.env.WANDB_API_KEY;
    if (!key)
        throw new WandbError("Set WANDB_API_KEY first (free at wandb.ai/settings).");
    const res = await fetch(API, {
        method: "POST",
        headers: { "User-Agent": "weightsbiases-mcp/1.0", "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401 || res.status === 403)
        throw new WandbError("W&B refused (401/403). Check WANDB_API_KEY.");
    if (!res.ok)
        throw new WandbError(`W&B error ${res.status}`);
    const data = (await res.json());
    if (data.errors)
        throw new WandbError(`W&B: ${String(data.errors[0]?.message ?? "query failed").slice(0, 200)}`);
    return data.data;
}
export async function myProfile() {
    const data = await gql("{ viewer { username email } }");
    const v = data.viewer ?? {};
    return { username: v.username, email: v.email };
}
export async function listProjects(entity, limit = 10) {
    if (!entity.trim())
        throw new WandbError("Entity (username or team) is empty.");
    const data = await gql(`query($entity: String!, $n: Int!) {
      user(username: $entity) { projects(first: $n) { edges { node { name entityName } } } }
    }`, { entity: entity.trim(), n: Math.min(Math.max(limit, 1), 50) });
    const edges = data.user?.projects?.edges ?? [];
    return edges.slice(0, limit).map((e) => ({ name: String(e.node?.name ?? "?"), entity: e.node?.entityName }));
}
export async function listRuns(entity, project, limit = 5) {
    if (!entity.trim() || !project.trim())
        throw new WandbError("Entity and project are required.");
    const data = await gql(`query($entity: String!, $project: String!, $n: Int!) {
      project(entityName: $entity, name: $project) {
        runs(first: $n, order: "-created_at") { edges { node { name state createdAt } } }
      }
    }`, { entity: entity.trim(), project: project.trim(), n: Math.min(Math.max(limit, 1), 20) });
    const edges = data.project?.runs?.edges ?? [];
    if (!data.project)
        throw new WandbError(`No project "${project}" for "${entity}".`);
    return edges.slice(0, limit).map((e) => ({
        name: e.node?.name,
        state: e.node?.state,
        created: e.node?.createdAt ? String(e.node.createdAt).slice(0, 10) : undefined,
    }));
}
// ---- muxH tools:
// All three tools above call Weights & Biases' GraphQL API with an account token
// and report the caller's own runs and projects. These two need no token: they
// read the public model and dataset indexes, which is where the metadata a training
// run is compared against actually comes from.
const WB_HF = "https://huggingface.co/api";
const WB_HF_UA = "mcfentmen-weightsbiases-mcp/1.2 (contactae2000@gmail.com)";
async function wbHfGet(path, label) {
    let res;
    try {
        res = await fetch(`${WB_HF}${path}`, { headers: { "User-Agent": WB_HF_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    }
    catch (e) {
        throw new Error(`Could not reach the public model index: ${e.message}`);
    }
    if (res.status === 401 || res.status === 403) {
        throw new Error(`${label} is gated and needs a Hugging Face token. The public index carries no credential here, so a gated repository cannot be read.`);
    }
    if (res.status === 404)
        throw new Error(`${label} is not in the public index.`);
    if (!res.ok)
        throw new Error(`${label} returned HTTP ${res.status}.`);
    return (await res.json());
}
const wbList = (value) => {
    if (!value)
        return "not declared";
    return Array.isArray(value) ? value.join(", ") : value;
};
const wbBn = (n) => {
    if (!n || !Number.isFinite(n))
        return "not reported";
    if (n >= 1e9)
        return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6)
        return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3)
        return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};
const wbBytes = (n) => {
    if (!Number.isFinite(n) || n <= 0)
        return "size not reported";
    if (n >= 1073741824)
        return `${(n / 1073741824).toFixed(2)} GB`;
    if (n >= 1048576)
        return `${(n / 1048576).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(n / 1024))} KB`;
};
const WB_WEIGHT = /\.(safetensors|bin|pt|pth|gguf|ckpt|onnx|msgpack|h5)$/i;
const WB_CONFIG = /(^|\/)(config\.json|generation_config\.json|tokenizer\.json|tokenizer_config\.json|special_tokens_map\.json|preprocessor_config\.json|vocab\.(json|txt))$/i;
/**
 * What a public model card and its weight index actually declare, read from the
 * public index rather than a marketing page: licence, data, languages, size and
 * precision, and whether the weights are in a format a loader can read.
 */
export async function modelCardAudit(args) {
    let model = String(args?.model ?? "").trim();
    if (!model)
        throw new Error("Give a model id such as google-bert/bert-base-uncased, or its full huggingface.co URL.");
    model = model
        .replace(/^https?:\/\/(www\.)?huggingface\.co\//i, "")
        .replace(/[?#].*$/, "")
        .replace(/^\/+|\/+$/g, "");
    if (!/^[^/\s]+\/[^/\s]+$/.test(model))
        throw new Error(`"${model}" is not a model id; they look like author/name.`);
    const siblingLimit = Math.round(Math.min(Math.max(Number(args?.siblings ?? 6) || 6, 0), 20));
    const repoPath = model.split("/").map(encodeURIComponent).join("/");
    const detail = await wbHfGet(`/models/${repoPath}?blobs=true`, `model ${model}`);
    const card = detail.cardData ?? {};
    const safetensors = detail.safetensors ?? null;
    const params = Number(safetensors?.total ?? 0) || null;
    const precisions = safetensors?.parameters ? Object.entries(safetensors.parameters).sort((a, b) => b[1] - a[1]) : [];
    const files = Array.isArray(detail.siblings) ? detail.siblings : [];
    const names = files.map((f) => String(f.rfilename ?? "")).filter(Boolean);
    const weightFiles = files.filter((f) => WB_WEIGHT.test(String(f.rfilename ?? "")));
    const configFiles = names.filter((n) => WB_CONFIG.test(n));
    const weightBytes = weightFiles.reduce((a, f) => a + (Number(f.size) || 0), 0);
    const datasets = card.datasets ?? [];
    const languages = card.language ?? [];
    const tasks = card.task_categories ?? card.tasks ?? [];
    const tags = (detail.tags ?? []).filter((t) => !String(t).startsWith("region:") && !String(t).startsWith("size_categories:"));
    const licence = wbList(card.license);
    const rows = [
        `${detail.id ?? model}${detail.pipeline_tag ? ` — ${detail.pipeline_tag}` : ""}`,
        `  author           ${detail.author ?? "not reported"}`,
        `  licence          ${licence}`,
        `  library          ${detail.library_name ?? "not declared"}`,
        `  parameters       ${params ? wbBn(params) : "no safetensors index, so the count is not published"}${precisions.length ? ` (${precisions.map(([p, n]) => `${p} ${wbBn(n)}`).join(", ")})` : ""}`,
        `  weights on disk  ${weightFiles.length} file(s), ${wbBytes(weightBytes)}${weightFiles.length ? ` — ${weightFiles.slice(0, 6).map((f) => f.rfilename).join(", ")}${weightFiles.length > 6 ? `, +${weightFiles.length - 6}` : ""}` : ""}`,
        `  config files     ${configFiles.length ? configFiles.slice(0, 8).join(", ") : "none of the usual tokenizer/config files"}`,
        `  data declared    ${wbList(datasets.length ? datasets : null)}`,
        `  languages        ${wbList(languages.length ? languages : null)}`,
        `  tasks            ${wbList(tasks.length ? tasks : null)}`,
        `  tags             ${tags.slice(0, 10).join(", ") || "none"}`,
        `  downloads        ${wbBn(detail.downloads)} | likes ${wbBn(detail.likes)} | files ${files.length}`,
        `  storage          ${wbBytes(Number(detail.usedStorage))}`,
        `  created          ${String(detail.createdAt ?? "not reported").slice(0, 10)} | last modified ${String(detail.lastModified ?? "not reported").slice(0, 10)}`,
        `  access           ${detail.gated ? `gated (${typeof detail.gated === "string" ? detail.gated : "terms attached"})` : "public"}${detail.private ? " | private" : ""}${detail.disabled ? " | disabled" : ""}`,
        `  card             https://huggingface.co/${detail.id ?? model}`,
    ];
    if (siblingLimit > 0 && detail.author) {
        const others = await wbHfGet(`/models?author=${encodeURIComponent(detail.author)}&sort=downloads&direction=-1&limit=${siblingLimit}`, `models by ${detail.author}`);
        const list = (Array.isArray(others) ? others : []).filter((m) => m.id !== detail.id);
        if (list.length) {
            rows.push("", `Other public models by ${detail.author}, by downloads:`);
            for (const m of list)
                rows.push(`  ${String(wbBn(m.downloads)).padStart(8)} dl  ${m.id}`);
        }
    }
    rows.push("", "note: every value here is the uploader's own declaration or the index's own count. A card that names no dataset does not mean none was used, a declared licence is a claim rather than a legal review, and the parameter count comes from the safetensors index so a repository publishing only .bin weights reports none.");
    return rows.join("\n");
}
/**
 * The public dataset index: what exists for a subject, how much it is used, and
 * what each entry declares about itself. A training run is only reproducible if
 * the dataset behind it can be named, and this is the place to look it up.
 */
export async function datasetCatalogue(args) {
    const query = String(args?.query ?? "").trim();
    if (!query)
        throw new Error("Give a subject to search for, for example sentiment, medical or code.");
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
    const rows = await wbHfGet(`/datasets?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=${limit}`, `datasets matching "${query}"`);
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
