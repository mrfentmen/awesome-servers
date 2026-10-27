const BASE = "https://galaxy.ansible.com/api/v3";
const UA = "mrfentmen-ansible-galaxy-mcp/1.0 (https://github.com/mrfentmen)";
export class GalaxyError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new GalaxyError(`Ansible Galaxy returned HTTP ${res.status}`);
    return (await res.json());
}
export async function collections(args) {
    const limit = Math.min(args.limit ?? 10, 20);
    const search = (args.search ?? "").trim().toLowerCase();
    const d = await get(`${BASE}/plugin/ansible/content/published/collections/index/?limit=100`);
    const list = (d?.data ?? []);
    let hits = list;
    if (search) {
        hits = list.filter((c) => {
            const ns = String(c?.namespace?.name ?? "").toLowerCase();
            const name = String(c?.name ?? "").toLowerCase();
            const desc = String(c?.description ?? "").toLowerCase();
            return ns.includes(search) || name.includes(search) || desc.includes(search);
        });
    }
    const shown = hits.slice(0, limit);
    if (!shown.length)
        return search ? `No collections match \"${args.search}\"` : "No collections found";
    const head = search
        ? `Ansible collections matching \"${args.search}\" (${hits.length} in first 100):`
        : `Ansible collections (${d?.meta?.count ?? list.length} total, first ${shown.length} shown):`;
    return head + "\n" + shown.map((c, i) => {
        const lv = c?.latest_version ?? {};
        const ns = c?.namespace?.name ?? "";
        const ver = lv?.version ?? "n/a";
        return `${i + 1}. ${ns}.${c?.name ?? "n/a"} v${ver}\n   ${(c?.description ?? "no description").slice(0, 140)}`;
    }).join("\n");
}
export async function collection(args) {
    const ns = (args.namespace ?? "").trim();
    const name = (args.name ?? "").trim();
    if (!ns || !name)
        throw new GalaxyError("Provide both namespace and collection name");
    const c = await get(`${BASE}/collections/${encodeURIComponent(ns)}/${encodeURIComponent(name)}/`);
    const lv = c?.latest_version ?? {};
    const lines = [
        `Collection: ${ns}.${name}`,
        `Latest version: ${lv?.version ?? "n/a"}`,
        `Published: ${lv?.created?.slice(0, 10) ?? "n/a"}`,
        `Description: ${(c?.description ?? "n/a").slice(0, 300)}`,
    ];
    const tags = (lv?.tags ?? []).slice(0, 8);
    if (tags.length)
        lines.push(`Tags: ${tags.join(", ")}`);
    if (lv?.download_count != null)
        lines.push(`Downloads: ${lv.download_count.toLocaleString()}`);
    return lines.join("\n");
}
function collectionPath(ns, name) {
    const namespace = (ns ?? "").trim();
    const collection = (name ?? "").trim();
    if (!namespace || !collection)
        throw new GalaxyError("Provide both namespace and collection name");
    return `${BASE}/plugin/ansible/content/published/collections/index/${encodeURIComponent(namespace)}/${encodeURIComponent(collection)}`;
}
const dayOf = (value) => (value ? value.slice(0, 10) : "not reported");
export async function collectionReleaseHistory(args) {
    const path = collectionPath(args.namespace ?? "", args.name ?? "");
    // the version route returns at most 100 rows however large limit is, verified
    // live with limit=200 on community.general, so ask for what it will actually give
    const envelope = await get(`${path}/versions/?limit=100`);
    const versions = envelope?.data ?? [];
    if (!versions.length)
        throw new GalaxyError("Ansible Galaxy lists no released versions for that collection");
    const labelled = versions.filter((v) => typeof v.version === "string");
    const dated = labelled
        .filter((v) => typeof v.created_at === "string")
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const marked = labelled.filter((v) => Array.isArray(v.marks) && v.marks.length > 0);
    const constraints = new Map();
    for (const v of labelled) {
        const key = v.requires_ansible ?? "not reported";
        constraints.set(key, (constraints.get(key) ?? 0) + 1);
    }
    const total = typeof envelope?.meta?.count === "number" ? envelope.meta.count : versions.length;
    const lines = [
        `Released versions of ${(args.namespace ?? "").trim()}.${(args.name ?? "").trim()}:`,
        `  versions in the Galaxy version list: ${total}`,
        `  versions read here: ${versions.length}, the newest first, which is one page of at most 100`,
    ];
    if (dated.length) {
        lines.push(`  oldest release on this page: ${dayOf(dated[0].created_at)} (${dated[0].version})`);
        lines.push(`  newest release on this page: ${dayOf(dated[dated.length - 1].created_at)} (${dated[dated.length - 1].version})`);
    }
    else {
        lines.push("  Galaxy reported no publish dates for these versions.");
    }
    lines.push(`  versions carrying one or more marks: ${marked.length}${marked.length ? `, for example ${marked
        .slice(0, 5)
        .map((v) => v.version)
        .join(", ")}` : ""}`);
    lines.push("  the ansible core constraint each release on this page declares:");
    for (const [key, n] of [...constraints.entries()].sort((a, b) => b[1] - a[1])) {
        lines.push(`    ${key}: ${n} version(s)`);
    }
    lines.push("  the newest ten releases:");
    for (const v of versions.slice(0, 10)) {
        lines.push(`    ${v.version ?? "?"} on ${dayOf(v.created_at)}, needs ansible ${v.requires_ansible ?? "not reported"}`);
    }
    if (versions.length > 10)
        lines.push(`    and ${versions.length - 10} more on this page`);
    if (total > versions.length) {
        lines.push(`  ${total - versions.length} further version(s) exist in the Galaxy list and are on later pages.`);
    }
    return lines.join("\n");
}

const GALAXY = 'https://galaxy.ansible.com/api/v3/plugin/ansible/content/published/collections/index';
export async function collectionContents(args = {}) {
    const ns = String(args?.namespace ?? '').trim().toLowerCase();
    const name = String(args?.name ?? '').trim().toLowerCase();
    const version = String(args?.version ?? '').trim();
    if (!/^[a-z0-9_]+$/.test(ns) || !/^[a-z0-9_]+$/.test(name))
        throw new Error('Namespace and name look like community and general.');
    if (!/^[0-9][0-9a-z.+-]*$/i.test(version))
        throw new Error('Give the exact released version, like 13.4.0.');
    const url = `${GALAXY}/${ns}/${name}/versions/${encodeURIComponent(version)}/`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-ansible-galaxy-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new Error(`Galaxy has no ${ns}.${name} ${version}`);
    if (!res.ok)
        throw new Error(`Galaxy returned ${res.status}`);
    const d = (await res.json());
    const m = d.metadata ?? {};
    const artifact = d.artifact ?? {};
    const deps = Object.entries(m.dependencies ?? {});
    const files = Array.isArray(d.files) ? d.files : [];
    const size = Number(artifact.size ?? 0);
    return [
        `${ns}.${name} ${d.version}`,
        `Requires ansible-core ${d.requires_ansible ?? 'unspecified'} · licence ${m.license ?? 'not stated'}`,
        `Tarball: ${artifact.filename ?? '?'} · ${size ? (size / 1048576).toFixed(2) + ' MB' : '?'}`,
        artifact.sha256 ? `sha256: ${artifact.sha256}` : 'sha256: not published',
        d.git_commit_sha ? `Source commit: ${d.git_commit_sha}${d.git_url ? ` (${d.git_url})` : ''}` : 'Source commit: not recorded',
        `Published: ${String(d.created_at ?? '').slice(0, 10) || '?'}`,
        (m.authors ?? []).length ? `Authors: ${(m.authors ?? []).join(', ')}` : '',
        (m.tags ?? []).length ? `Tags: ${(m.tags ?? []).join(', ')}` : '',
        deps.length ? `Dependencies (${deps.length}): ${deps.slice(0, 10).map(([k, v]) => `${k} ${v}`).join(', ')}${deps.length > 10 ? ' …' : ''}` : 'Dependencies: none',
        files.length ? `Files in the tarball: ${files.length}` : '',
        `Download: ${d.download_url ?? url}`,
        m.homepage ? `Home: ${m.homepage}` : '',
    ].filter(Boolean).join('\n');
}
