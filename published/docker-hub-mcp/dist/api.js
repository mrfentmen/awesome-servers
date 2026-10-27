const BASE = "https://hub.docker.com/v2";
const UA = "mrfentmen-docker-hub-mcp/1.0 (https://github.com/mrfentmen)";
export class DockerError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new DockerError("Docker Hub rate limit hit, wait and retry");
    if (!res.ok)
        throw new DockerError(`Docker Hub error ${res.status}`);
    return (await res.json());
}
export async function imageInfo(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new DockerError("Provide an image name like library/nginx");
    const d = await get(`${BASE}/repositories/${name.split("/").map(encodeURIComponent).join("/")}`);
    return `Image: ${d?.name ?? name}\nDescription: ${d?.description ?? "n/a"}\nPull count: ${(d?.pull_count ?? 0).toLocaleString()}\nStars: ${d?.star_count ?? 0}\nLast updated: ${d?.last_updated ? new Date(d.last_updated).toISOString().slice(0, 10) : "n/a"}\nTags: ${(d?.tags?.length ?? 0)}`;
}
export async function searchImages(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new DockerError("Provide search terms");
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/search/repositories?query=${encodeURIComponent(q)}&page_size=${limit}`);
    const results = d?.results ?? [];
    if (!results.length)
        return "No images found";
    return results.map((r, i) => {
        const pulls = (r?.pull_count ?? 0);
        const pullsStr = pulls >= 1e9 ? (pulls / 1e9).toFixed(1) + "B" : pulls >= 1e6 ? (pulls / 1e6).toFixed(1) + "M" : pulls >= 1e3 ? (pulls / 1e3).toFixed(1) + "K" : String(pulls);
        return `${i + 1}. ${r?.repo_name ?? "n/a"} | ${pullsStr} pulls | ${r?.star_count ?? 0} stars\n   ${(r?.short_description ?? "").slice(0, 120)}`;
    }).join("\n\n");
}
// Docker Hub silently caps page_size at 100: asking for 1000 on the 1,339
// nginx tags returns exactly 100, verified live, so the ceiling is applied here
// and stated rather than passed through.
const DOCKER_PAGE_MAX = 100;
// The orderings that answer 200, checked one value at a time. last_pushed and
// first_pushed both fail, and a bad ordering answers HTTP 500 rather than 400,
// so the value is validated before any request is made.
const DOCKER_REPO_SORT = ["last_updated", "name", "pull_count"];
// Docker Hub answers its own reason in a message field, and distinguishing a
// missing tag from a missing repository needs that text, so this helper reads
// the body even on a failure.
async function dockerGet(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    const body = (await res.json().catch(() => null));
    if (!res.ok) {
        const message = body && typeof body === "object" && typeof body.message === "string"
            ? String(body.message)
            : `Docker Hub error ${res.status}`;
        throw new DockerError(message);
    }
    if (!body)
        throw new DockerError("Docker Hub answered with a body that is not JSON");
    return body;
}
function dockerDay(value) {
    return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : "date not reported";
}
// Buildkit attestation manifests arrive as os unknown and architecture unknown
// next to the real platform images, verified on library/nginx where a tag
// carried eight of them, so they are separated out instead of padding the
// platform list with rows that cannot be run.
// The size a listing shows is the amd64 one where the tag carries it, because
// that is the platform this is nearly always read from, and the full set of
// sizes and digests belongs to tag_platforms rather than to a list of a hundred
// tags that would otherwise run to over a thousand lines.
export async function namespaceRepositories(args) {
    const namespace = (args.namespace ?? "").trim().toLowerCase();
    if (!namespace)
        throw new DockerError("Provide a namespace, like library for official images or bitnami.");
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 25), 1), DOCKER_PAGE_MAX);
    const sort = (args.sort ?? "pull_count").trim();
    if (!DOCKER_REPO_SORT.includes(sort)) {
        throw new DockerError(`Unknown sort "${sort}". Docker Hub accepts ${DOCKER_REPO_SORT.join(", ")} for repositories.`);
    }
    const page = Math.max(1, Math.trunc(args.page ?? 1));
    const data = await dockerGet(`${BASE}/namespaces/${encodeURIComponent(namespace)}/repositories?page_size=${limit}&page=${page}&ordering=${encodeURIComponent(sort)}`);
    const rows = Array.isArray(data?.results) ? data.results : [];
    if (!rows.length) {
        // An unknown namespace answers HTTP 200 with an empty list rather than a
        // 404, verified live, so this is the only place the caller can be warned.
        return `Docker Hub returned no repositories for the namespace "${namespace}". An unknown namespace answers an empty list rather than an error, so check the spelling, or run search_images to find the real one.`;
    }
    const count = typeof data.count === "number" ? data.count : rows.length;
    const lines = [
        `Namespace ${namespace}: ${count.toLocaleString()} repositories, sorted by ${sort}, page ${page}, ${rows.length} shown`,
        "",
        ...rows.map((row, i) => {
            const flags = [
                row.repository_type === "image" ? "" : `${row.repository_type ?? "type unknown"}`,
                row.is_private === true ? "private" : "",
                typeof row.status_description === "string" && row.status_description !== "active" ? row.status_description : "",
            ].filter(Boolean);
            return [
                `${i + 1}. ${row.namespace ?? namespace}/${row.name ?? "?"} - ${Number(row.pull_count ?? 0).toLocaleString()} pulls, ${Number(row.star_count ?? 0).toLocaleString()} stars${flags.length ? ` (${flags.join(", ")})` : ""}`,
                `   updated ${dockerDay(row.last_updated)}`,
                row.description ? `   ${String(row.description).replace(/\s+/g, " ").slice(0, 180)}` : "",
            ]
                .filter(Boolean)
                .join("\n");
        }),
    ];
    if (count > rows.length * page)
        lines.push("", `More repositories exist, ask for page ${page + 1}.`);
    return lines.join("\n");
}
