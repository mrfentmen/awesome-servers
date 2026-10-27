/**
 * OpenSecrets API client. Needs OPENSECRETS_API_KEY
 * (free at https://www.opensecrets.org/api/).
 * Docs: https://www.opensecrets.org/resources/create/apis.php
 */
const BASE = "https://www.opensecrets.org/api";
export class OpenSecretsError extends Error {
}
function apiKey() {
    const k = process.env.OPENSECRETS_API_KEY;
    if (!k)
        throw new OpenSecretsError("Set OPENSECRETS_API_KEY first (free at opensecrets.org/api).");
    return k;
}
async function getJson(params) {
    const qs = new URLSearchParams({ ...params, apikey: apiKey(), output: "json" }).toString();
    const res = await fetch(`${BASE}/?${qs}`, {
        headers: { "User-Agent": "opensecrets-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401 || res.status === 403)
        throw new OpenSecretsError("OpenSecrets refused (401/403). Check API key.");
    if (!res.ok)
        throw new OpenSecretsError(`OpenSecrets error ${res.status}`);
    return (await res.json());
}
export async function searchCandidates(query, cycle = "2024") {
    if (!query.trim())
        throw new OpenSecretsError("Query is empty.");
    const data = await getJson({ method: "getLegislators", id: query.trim() });
    const rows = Array.isArray(data.response?.legislator) ? data.response.legislator : [];
    const attrs = (r) => r["@attributes"] ?? {};
    return rows.slice(0, 10).map((r) => {
        const a = attrs(r);
        return {
            id: a.cid,
            name: `${a.firstname ?? ""} ${a.lastname ?? ""}`.trim() || undefined,
            party: a.party,
            state: a.state,
            chamber: a.chamber,
        };
    });
}
export async function candidateSummary(cid, cycle = "2024") {
    if (!cid.trim())
        throw new OpenSecretsError("Candidate id is empty.");
    const data = await getJson({ method: "candSummary", cid: cid.trim(), cycle });
    const a = data.response?.summary?.["@attributes"] ?? {};
    if (!a.candidate_name)
        throw new OpenSecretsError(`No summary for ${cid} in ${cycle}.`);
    return [
        `${a.candidate_name ?? cid}${a.party ? ` (${a.party}-${a.state ?? "?"})` : ""} — ${cycle} cycle`,
        `Raised: $${Number(a.total ?? 0).toLocaleString()}`,
        `Spent: $${Number(a.spent ?? 0).toLocaleString()}`,
        `Cash on hand: $${Number(a.cash_on_hand ?? 0).toLocaleString()}`,
        `Debt: $${Number(a.debt ?? 0).toLocaleString()}`,
        a.source ? `Source: ${a.source}` : "",
    ].filter(Boolean).join("\n");
}
export function formatCandidate(c, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${c.id ?? "?"}] ${c.name ?? "(unnamed)"}${c.party ? ` (${c.party}${c.state ? `-${c.state}` : ""})` : ""}${c.chamber ? ` — ${c.chamber}` : ""}`;
}
// ---- muxB tools:
// OpenFEC, the FEC's own open API. DEMO_KEY is the placeholder the FEC
// documents for public use and reaches the candidate and committee indexes.
const FEC_BASE = "https://api.open.fec.gov/v1";
const FEC_DEMO_KEY = "DEMO_KEY";
async function fecGet(path, params = []) {
    const qs = new URLSearchParams([...params, ["api_key", FEC_DEMO_KEY]]);
    const res = await fetch(`${FEC_BASE}${path}?${qs.toString()}`, {
        headers: { "User-Agent": "opensecrets-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 429)
        throw new OpenSecretsError("OpenFEC DEMO_KEY is limited to 40 calls an hour; wait or register a key at api.data.gov.");
    if (res.status === 422) {
        const detail = (await res.json().catch(() => ({}))).message;
        throw new OpenSecretsError(`OpenFEC rejected the query${detail ? `: ${String(detail).slice(0, 200)}` : "."}`);
    }
    if (!res.ok)
        throw new OpenSecretsError(`OpenFEC error ${res.status}`);
    return (await res.json());
}
function fecCycles(row) {
    const list = Array.isArray(row.cycles) ? row.cycles : [];
    if (list.length === 0)
        return "cycles not reported";
    const shown = list.slice(0, 6).map(String);
    return shown.join(", ") + (list.length > 6 ? `, +${list.length - 6} more` : "");
}
function fecCommitteeLine(c) {
    const designation = c.designation_full ?? c.designation ?? "";
    return `      ${c.committee_id ?? "?"} ${c.name ?? "(unnamed)"}${designation ? ` [${designation}]` : ""}${c.committee_type_full ? ` (${c.committee_type_full})` : ""}`;
}
export async function fecCandidateSearch(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new OpenSecretsError("Query is empty.");
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
    const params = [["q", q], ["per_page", String(limit)], ["sort", "-receipts"]];
    const office = (args.office ?? "").trim().toUpperCase();
    if (office)
        params.push(["office", office]);
    const state = (args.state ?? "").trim().toUpperCase();
    if (state)
        params.push(["state", state]);
    const party = (args.party ?? "").trim().toUpperCase();
    if (party)
        params.push(["party", party]);
    const data = await fecGet("/candidates/search/", params);
    const rows = Array.isArray(data.results) ? data.results : [];
    if (rows.length === 0)
        return `No FEC candidate records match "${q}".`;
    const total = (data.pagination ?? {}).count;
    return [
        `FEC candidate index for "${q}"${office ? `, office ${office}` : ""}${state ? `, ${state}` : ""}${party ? `, ${party}` : ""} - ${Number(total ?? 0).toLocaleString()} match, showing ${rows.length}:`,
        ...rows.map((r, i) => {
            const committees = Array.isArray(r.principal_committees) ? r.principal_committees : [];
            return [
                `${i + 1}. ${r.name ?? "(unnamed)"} [${r.candidate_id ?? "?"}]`,
                `      ${r.office_full ?? r.office ?? "office not reported"}${r.district && r.district !== "00" ? `-${r.district}` : ""} · ${r.state ?? "?"} · ${r.party_full ?? r.party ?? "party not reported"}`,
                `      status ${r.candidate_status ?? "not reported"}${r.incumbent_challenge_full ? `, ${r.incumbent_challenge_full}` : ""} · raised funds: ${r.has_raised_funds === true ? "yes" : r.has_raised_funds === false ? "no" : "not reported"}`,
                `      cycles: ${fecCycles(r)}`,
                committees.length ? `      principal committees:` : "      principal committees: not reported",
                ...committees.slice(0, 3).map(fecCommitteeLine),
                committees.length > 3 ? `      ...and ${committees.length - 3} more committees` : "",
            ].filter(Boolean).join("\n");
        }),
    ].join("\n");
}
export async function fecCommitteeSearch(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new OpenSecretsError("Query is empty.");
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
    const data = await fecGet("/committees/", [["q", q], ["per_page", String(limit)], ["sort", "-receipts"]]);
    const rows = Array.isArray(data.results) ? data.results : [];
    if (rows.length === 0)
        return `No FEC committees match "${q}".`;
    const total = (data.pagination ?? {}).count;
    return [
        `FEC committee index for "${q}" - ${Number(total ?? 0).toLocaleString()} match, showing ${rows.length}:`,
        ...rows.map((r, i) => {
            const agent = [r.designated_agent_name, r.designated_agent_city, r.designated_agent_state].filter(Boolean).join(", ");
            const sponsor = Array.isArray(r.sponsor_candidate_list) ? r.sponsor_candidate_list.map((s) => String(s.name ?? s.candidate_id ?? "?")) : [];
            const candidates = Array.isArray(r.candidate_ids) ? r.candidate_ids.map(String) : [];
            return [
                `${i + 1}. ${r.name ?? "(unnamed committee)"} [${r.committee_id ?? "?"}]`,
                `      ${r.committee_type_full ?? "type not reported"}${r.designation_full ? ` · ${r.designation_full}` : ""}${r.party_full ? ` · ${r.party_full}` : ""}${r.state ? ` · ${r.state}` : ""}`,
                `      treasurer ${r.treasurer_name ?? "not reported"}${agent ? ` (designated agent ${agent})` : ""} · filing ${r.filing_frequency ?? "not reported"}`,
                `      cycles: ${fecCycles(r)} · first file ${r.first_file_date ?? "not reported"} · last file ${r.last_file_date ?? "not reported"}`,
                sponsor.length ? `      sponsored by: ${sponsor.slice(0, 3).join(", ")}${sponsor.length > 3 ? `, +${sponsor.length - 3} more` : ""}` : "",
                candidates.length ? `      linked candidate ids: ${candidates.slice(0, 4).join(", ")}${candidates.length > 4 ? `, +${candidates.length - 4} more` : ""}` : "",
                r.affiliated_committee_name ? `      affiliated with: ${r.affiliated_committee_name}` : "",
            ].filter(Boolean).join("\n");
        }),
    ].join("\n");
}
