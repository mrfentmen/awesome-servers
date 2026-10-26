export class ApolloError extends Error {
    constructor(message) {
        super(message);
        this.name = "ApolloError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers(json) {
    const k = process.env.APOLLO_API_KEY;
    if (!k)
        throw new ApolloError("Set APOLLO_API_KEY (free Apollo plan).");
    const h = { ...UA, Accept: "application/json", "X-Api-Key": k };
    if (json)
        h["Content-Type"] = "application/json";
    return h;
}
async function call(path, method, body) {
    let res;
    try {
        res = await fetch("https://api.apollo.io" + path, {
            method,
            headers: headers(method === "POST"),
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new ApolloError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new ApolloError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 12000);
}
export function health() {
    return call("/v1/auth/health", "GET");
}
export function matchPerson(email, firstName, lastName, organization) {
    const body = {};
    if (email)
        body.email = email;
    if (firstName)
        body.first_name = firstName;
    if (lastName)
        body.last_name = lastName;
    if (organization)
        body.organization_name = organization;
    return call("/v1/people/match", "POST", body);
}
export function searchPeople(query, limit) {
    const n = Math.min(Number(limit ?? 5) || 5, 25);
    return call("/v1/mixed_people/api_search", "POST", { q_keywords: query, page: 1, per_page: n });
}
export function peopleSearch(query, limit) {
    const n = Math.min(Number(limit ?? 5) || 5, 25);
    return call("/v1/mixed_people/search", "POST", { q_keywords: query, page: 1, per_page: n });
}
export function companySearch(query, limit) {
    const n = Math.min(Number(limit ?? 5) || 5, 25);
    return call("/v1/mixed_companies/search", "POST", { q_organization_name: query, page: 1, per_page: n });
}
export function orgEnrich(domain) {
    return call(`/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`, "GET");
}
export function bulkMatch(emails) {
    const list = emails.split(",").map((e) => e.trim()).filter(Boolean).slice(0, 10)
        .map((email) => ({ email }));
    return call("/v1/people/bulk_match", "POST", { details: list });
}
export function getContact(contactId) {
    return call(`/v1/contacts/${encodeURIComponent(contactId)}`, "GET");
}
export function accountSearch(query, limit) {
    const n = Math.min(Number(limit ?? 5) || 5, 25);
    return call("/v1/accounts/search", "POST", { q_organization_name: query, page: 1, per_page: n });
}
export function peopleSearchV1(titles, limit) {
    const n = Math.min(Number(limit ?? 5) || 5, 25);
    return call("/v1/people/search", "POST", { person_titles: titles.split(",").map((t) => t.trim()), page: 1, per_page: n });
}
