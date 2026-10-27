const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const UA = "mrfentmen-pubmed-mcp/1.0 (https://github.com/mrfentmen)";
export class PubmedError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new PubmedError(`NCBI returned HTTP ${res.status}`);
    return (await res.json());
}
function fmtSummary(uid, s) {
    const authors = (s.authors ?? []).slice(0, 3).map((a) => a.name ?? "").join(", ");
    const more = (s.authors ?? []).length > 3 ? ` et al.` : "";
    const loc = [s.volume, s.issue, s.pages].filter(Boolean).join(":");
    return `PMID ${uid} | ${s.source ?? "n/a"} ${pubyear(s.pubdate)}${loc ? ` ${loc}` : ""}\n   ${s.title ?? "no title"}\n   ${authors}${more}`;
}
function pubyear(pubdate) {
    if (!pubdate)
        return "";
    const m = pubdate.match(/^\d{4}/);
    return m ? m[0] : pubdate.slice(0, 10);
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new PubmedError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmode=json&retmax=${limit}`);
    const uids = d?.esearchresult?.idlist ?? [];
    if (!uids.length)
        return "No PubMed results found";
    const e = await get(`${EUTILS}/esummary.fcgi?db=pubmed&id=${uids.join(",")}&retmode=json`);
    const result = e?.result ?? {};
    return uids.map((uid) => fmtSummary(uid, result[uid] ?? {})).join("\n\n");
}
export async function article(args) {
    const pmid = (args.pmid ?? "").trim();
    if (!/^\d+$/.test(pmid))
        throw new PubmedError("Provide a numeric PubMed ID");
    const e = await get(`${EUTILS}/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`);
    const result = e?.result ?? {};
    const s = result[pmid];
    if (!s)
        return `No article found for PMID ${pmid}`;
    const authors = (s.authors ?? []).map((a) => a.name ?? "").filter(Boolean).join(", ");
    const lines = [
        `Title: ${s.title ?? "n/a"}`,
        `Journal: ${s.source ?? "n/a"}`,
        `Published: ${s.pubdate ?? "n/a"}`,
        `Citation: ${[s.volume, s.issue, s.pages].filter(Boolean).join(":") || "n/a"}`,
        `Authors: ${authors || "n/a"}`,
        s.abstract ? `\nAbstract:\n${s.abstract}` : "",
        s.fulljournalname ? `\nFull journal name: ${s.fulljournalname}` : "",
    ];
    return lines.filter((l) => l !== "" && l !== undefined).join("\n");
}
function validPmid(pmid) {
    const id = pmid.trim();
    if (!/^\d+$/.test(id))
        throw new PubmedError("Provide a numeric PubMed ID");
    return id;
}
async function getText(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/plain" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new PubmedError(`NCBI returned HTTP ${res.status}`);
    return res.text();
}
export async function abstract(args) {
    const pmid = validPmid(args.pmid ?? "");
    const t = await getText(`${EUTILS}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=text&rettype=abstract`);
    return t.slice(0, 4000) || `No abstract for PMID ${pmid}`;
}
export async function medline(args) {
    const pmid = validPmid(args.pmid ?? "");
    const t = await getText(`${EUTILS}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=text&rettype=medline`);
    return t.slice(0, 4000) || `No MEDLINE record for PMID ${pmid}`;
}
export async function citedBy(args) {
    const pmid = validPmid(args.pmid ?? "");
    const limit = Math.min(args.limit ?? 10, 25);
    const e = await get(`${EUTILS}/elink.fcgi?dbfrom=pubmed&id=${pmid}&retmode=json&linkname=pubmed_pubmed_citedin`);
    const sets = e?.linksets ?? [];
    const ids = [];
    for (const s of sets) {
        for (const lu of s?.linksetdbs ?? []) {
            for (const l of lu?.links ?? [])
                ids.push(String(l));
        }
    }
    if (!ids.length)
        return `No citing articles found for PMID ${pmid}`;
    const f = await get(`${EUTILS}/esummary.fcgi?db=pubmed&id=${ids.slice(0, limit).join(",")}&retmode=json`);
    const result = f?.result ?? {};
    return ids.slice(0, limit).map((uid, i) => `${i + 1}. ${fmtSummary(uid, result[uid] ?? {}).split("\n")[0]}`).join("\n");
}
export async function spellcheck(args) {
    const term = (args.term ?? "").trim();
    if (!term)
        throw new PubmedError("Provide a term");
    const e = await get(`${EUTILS}/espell.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json`);
    const suggestions = e?.spellcheck?.suggestions ?? e?.suggestions ?? [];
    const words = Array.isArray(suggestions) ? suggestions.map(String) : Object.keys(suggestions);
    return words.length ? `Did you mean: ${words.slice(0, 5).join(", ")}?` : `No suggestions for "${term}"`;
}
export async function dbInfo(args) {
    const db = (args.db ?? "").trim() || "pubmed";
    const e = await get(`${EUTILS}/einfo.fcgi?db=${encodeURIComponent(db)}&retmode=json`);
    const info = e?.dbinfo ?? {};
    return `Database ${info.name ?? db}: ${info.description ?? ""}\nRecords: ${info.count ?? "?"} | Updated: ${info.lastupdate ?? "?"}\nFields: ${(info.fields ?? []).slice(0, 10).map((f) => f.name).filter(Boolean).join(", ")}`;
}
export async function meshSearch(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new PubmedError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${EUTILS}/esearch.fcgi?db=mesh&term=${encodeURIComponent(q)}&retmode=json&retmax=${limit}`);
    const uids = d?.esearchresult?.idlist ?? [];
    if (!uids.length)
        return "No MeSH terms found";
    const e = await get(`${EUTILS}/esummary.fcgi?db=mesh&id=${uids.join(",")}&retmode=json`);
    const result = e?.result ?? {};
    return uids.map((uid, i) => `${i + 1}. ${result[uid]?.ds_meshterm ?? result[uid]?.name ?? uid}`).join("\n");
}
