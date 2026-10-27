const BASE = "https://search.maven.org/solrsearch/select";
const UA = "mrfentmen-maven-info-mcp/1.0 (https://github.com/mrfentmen)";
export class MavenError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new MavenError(`Maven Central returned HTTP ${res.status}`);
    return (await res.json());
}
function fmtDoc(d, i) {
    const ts = d?.timestamp ? new Date(d.timestamp).toISOString().slice(0, 10) : "";
    const latest = d?.latestVersion ?? "";
    return `${i + 1}. ${d?.id ?? "n/a"}\n   Latest ${latest} | versions ${d?.versionCount ?? 0} | ${ts}`;
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new MavenError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}?q=${encodeURIComponent(q)}&rows=${limit}&wt=json`);
    const docs = (d?.response?.docs ?? []);
    const total = d?.response?.numFound ?? 0;
    if (!docs.length)
        return "No artifacts found";
    return `Maven Central results for \"${q}\" (${total} total):\n` + docs.map(fmtDoc).join("\n");
}
export async function artifact(args) {
    const g = (args.groupId ?? "").trim();
    const a = (args.artifactId ?? "").trim();
    if (!g || !a)
        throw new MavenError("Provide both groupId and artifactId");
    const d = await get(`${BASE}?q=g:${encodeURIComponent(g)}+AND+a:${encodeURIComponent(a)}&rows=1&wt=json`);
    const doc = d?.response?.docs?.[0];
    if (!doc)
        throw new MavenError(`Artifact not found: ${g}:${a}`);
    const lines = [
        `Artifact: ${doc?.id ?? `${g}:${a}`}`,
        `Latest version: ${doc?.latestVersion ?? "n/a"}`,
        `Versions: ${doc?.versionCount ?? "n/a"}`,
    ];
    if (doc?.timestamp)
        lines.push(`Last updated: ${new Date(doc.timestamp).toISOString().slice(0, 10)}`);
    return lines.join("\n");
}
// ---- muxF tools:
const SOLR = "https://search.maven.org/solrsearch/select";
const CENTRAL = "https://repo1.maven.org/maven2";
// Maven Central's Solr index is slow on cold group queries and drops the
// occasional connection, so give it a longer budget than the row lookups and
// retry once before giving up.
async function solr(query, core, rows) {
    const url = `${SOLR}?q=${encodeURIComponent(query)}&core=${core}&rows=${rows}&wt=json`;
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const res = await fetch(url, {
                headers: { "User-Agent": UA, Accept: "application/json" },
                signal: AbortSignal.timeout(25000),
            });
            if (!res.ok)
                throw new MavenError(`Maven Central returned HTTP ${res.status}`);
            return (await res.json());
        }
        catch (error) {
            lastError = error;
        }
    }
    throw new MavenError(`Maven Central did not answer for that query: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
function dayOf(stamp) {
    const n = Number(stamp);
    return Number.isFinite(n) && n > 0 ? Math.floor(n / 1000) : NaN;
}
function releaseKind(version) {
    if (/-SNAPSHOT$/i.test(version))
        return "snapshot, so it is not a fixed release";
    if (/-M\d+$/i.test(version))
        return "milestone";
    if (/-RC\d+$/i.test(version))
        return "release candidate";
    if (/-(alpha|beta)\d*$/i.test(version))
        return "pre-release";
    if (/-(jre|android|server|dist|minimal|source|shaded|all|plain|web|uber)(\.|$)/i.test(version))
        return "release with a platform suffix";
    return "plain release";
}
/** Confirm one coordinate exists and turn it into a ready to paste Maven dependency block. */
export async function dependencyBlock(args) {
    const g = (args.groupId ?? "").trim();
    const a = (args.artifactId ?? "").trim();
    const v = (args.version ?? "").trim();
    if (!g || !a)
        throw new MavenError("Provide both groupId and artifactId");
    if (!/^[A-Za-z0-9_.-]+$/.test(g))
        throw new MavenError(`Not a valid groupId: "${g}"`);
    if (!/^[A-Za-z0-9_.-]+$/.test(a))
        throw new MavenError(`Not a valid artifactId: "${a}"`);
    const d = await solr(v ? `g:${g} AND a:${a} AND v:${v}` : `g:${g} AND a:${a}`, "gav", v ? 1 : 5);
    const docs = (d.response?.docs ?? []).filter((x) => x.v);
    if (!docs.length) {
        return v
            ? `Maven Central's version index holds no ${g}:${a}:${v}. Check the version, or omit it to see what is published.`
            : `Maven Central holds no artifact ${g}:${a}.`;
    }
    const doc = docs[0];
    const chosen = String(doc.v);
    const kind = releaseKind(chosen);
    const stamp = dayOf(doc.timestamp);
    const repoPath = `${g.replace(/\./g, "/")}/${a}/${chosen}/${a}-${chosen}.pom`;
    const lines = [
        `${g}:${a} resolved against Maven Central`,
        `Version chosen: ${chosen} (${kind})`,
        `Published: ${Number.isFinite(stamp) ? new Date(stamp * 1000).toISOString().slice(0, 10) : "date not reported"}`,
        `Packaging: ${doc.p ?? "not reported"}`,
        `Published files: ${doc.ec?.length ? doc.ec.join(", ") : "not reported"}`,
        v ? '' : `Newer or equal versions also on file: ${docs.slice(1).map((x) => x.v).join(", ") || "none newer on this page"}`,
        '',
        'Maven dependency block:',
        '<dependency>',
        `  <groupId>${g}</groupId>`,
        `  <artifactId>${a}</artifactId>`,
        `  <version>${chosen}</version>`,
        '</dependency>',
        '',
        'With the version held in a property:',
        '<properties>',
        `  <${a}.version>${chosen}</${a}.version>`,
        '</properties>',
        '',
        `POM the block will be resolved against: ${CENTRAL}/${repoPath}`,
    ];
    return lines.filter((l) => l !== '').join("\n");
}
