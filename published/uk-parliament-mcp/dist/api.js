/**
 * UK Parliament — keyless public API client.
 */
const BASE = "https://members-api.parliament.uk";
const SOURCE = "UK Parliament";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "uk-parliament-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
const BILLS = "https://bills-api.parliament.uk/api/v1";
function memberLine(v) {
    const party = clean(v?.latestParty?.name);
    const house = clean(v?.latestHouseMembership?.house) === "1" ? "Commons" : clean(v?.latestHouseMembership?.house) === "2" ? "Lords" : "?";
    return `- ${clean(v?.nameDisplayAs)} (id ${v?.id}) · ${house}${party ? ` · ${party}` : ""}${v?.latestHouseMembership?.membershipFrom ? ` · ${clean(v.latestHouseMembership.membershipFrom)}` : ""}`;
}
export async function searchMembers(a) {
    const name = clean(a.name);
    if (name.length < 2)
        throw new SourceError("name must be at least 2 characters");
    const limit = a.limit ?? 5;
    if (!Number.isInteger(limit) || limit < 1 || limit > 20)
        throw new SourceError("limit must be between 1 and 20");
    const d = await getJson(`/api/Members/Search?Name=${encodeURIComponent(name)}&take=${limit}`);
    const items = Array.isArray(d?.items) ? d.items : [];
    if (!items.length)
        return `Parliament has no member matching "${name}".`;
    return [
        `${d?.totalResults ?? items.length} member(s) match "${name}", showing ${items.length}:`,
        "",
        ...items.map((i) => memberLine(i.value)),
    ].join("\n");
}
export async function memberDetail(a) {
    if (!Number.isInteger(a.memberId) || a.memberId < 1)
        throw new SourceError("memberId must be a positive number");
    const d = await getJson(`/api/Members/${a.memberId}`);
    const v = d?.value;
    if (!v)
        return `Parliament has no member with id ${a.memberId}.`;
    const roles = Array.isArray(v?.governmentPosts) ? v.governmentPosts.slice(0, 4) : [];
    return [
        `${clean(v.nameDisplayAs)} (id ${v.id})`,
        `Full title: ${clean(v.nameFullTitle)}`,
        `House: ${clean(v.latestHouseMembership?.house) === "1" ? "Commons" : clean(v.latestHouseMembership?.house) === "2" ? "Lords" : "unknown"}${v.latestHouseMembership?.membershipFrom ? ` · ${clean(v.latestHouseMembership.membershipFrom)}` : ""}${v.latestParty?.name ? ` · party ${clean(v.latestParty.name)}` : ""}`,
        v.latestHouseMembership?.membershipStartDate ? `Member since ${clean(v.latestHouseMembership.membershipStartDate).slice(0, 10)}` : "",
        v.gender ? `Gender: ${clean(v.gender)}` : "",
        roles.length ? `Posts: ${roles.map((p) => clean(p.name)).filter(Boolean).join(", ")}` : "",
        `Profile: https://members.parliament.uk/member/${v.id}/contact`,
    ].filter(Boolean).join("\n");
}
export async function searchBills(a) {
    const term = clean(a.term);
    if (term.length < 3)
        throw new SourceError("term must be at least 3 characters");
    const limit = a.limit ?? 5;
    if (!Number.isInteger(limit) || limit < 1 || limit > 20)
        throw new SourceError("limit must be between 1 and 20");
    const d = await getJson(`${BILLS}/Bills?SearchTerm=${encodeURIComponent(term)}&take=${limit}`);
    const items = Array.isArray(d?.items) ? d.items : [];
    if (!items.length)
        return `No bill title matches "${term}".`;
    return [
        `${d?.totalResults ?? items.length} bill(s) match "${term}", showing ${items.length}:`,
        "",
        ...items.map((b) => `- ${clean(b.shortTitle)} (id ${b.billId}) · ${clean(b.currentHouse) || "?"}${b.isAct ? " · now an Act" : ""}${b.isWithdrawn ? " · withdrawn" : ""}${b.lastUpdate ? ` · updated ${clean(b.lastUpdate).slice(0, 10)}` : ""}`),
    ].join("\n");
}
export async function billDetail(a) {
    if (!Number.isInteger(a.billId) || a.billId < 1)
        throw new SourceError("billId must be a positive number");
    const d = await getJson(`${BILLS}/Bills/${a.billId}`);
    if (!d || !d.billId)
        return `No bill with id ${a.billId}.`;
    const sponsors = Array.isArray(d.sponsors) ? d.sponsors.slice(0, 6) : [];
    const stages = Array.isArray(d.stages) ? d.stages : [];
    return [
        `${clean(d.shortTitle)} (id ${d.billId})`,
        d.longTitle ? `Long title: ${clean(d.longTitle)}` : "",
        `Current house: ${clean(d.currentHouse) || "?"} · originated in ${clean(d.originatingHouse) || "?"}${d.isAct ? " · now an Act" : ""}${d.isWithdrawn ? " · withdrawn" : ""}`,
        d.summary ? `\nSummary: ${clean(d.summary).slice(0, 900)}` : "",
        sponsors.length ? `\nSponsors: ${sponsors.map((s) => `${clean(s.member?.nameDisplayAs) || clean(s.organisation?.name) || "sponsor"}${s.sponsorType ? ` (${clean(s.sponsorType)})` : ""}`).join(", ")}` : "",
        stages.length ? `\nStages (${stages.length}):\n${stages.slice(-8).map((s) => `  - ${clean(s.house)} · ${clean(s.description) || clean(s.stageSittings?.[0]?.stage?.description) || "stage"}${s.stageSittings?.[0]?.sittingDate ? ` · ${clean(s.stageSittings[0].sittingDate).slice(0, 10)}` : ""}`).join("\n")}` : "",
        `\nFull record: https://bills.parliament.uk/bills/${d.billId}`,
    ].filter(Boolean).join("\n");
}
