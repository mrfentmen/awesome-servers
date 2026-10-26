export class HashnodeError extends Error {
    constructor(message) {
        super(message);
        this.name = "HashnodeError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.HASHNODE_TOKEN;
    if (!k)
        throw new HashnodeError("Set HASHNODE_TOKEN (Hashnode PAT).");
    return k;
}
async function gql(query, variables = {}) {
    let res;
    try {
        res = await fetch("https://gql-beta.hashnode.com/", {
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: key() },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new HashnodeError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new HashnodeError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 12000);
}
export function me() {
    return gql("query { me { name username } }");
}
export function publicationPosts(host, limit) {
    const n = Math.min(Number(limit ?? 5) || 5, 20);
    return gql("query($h: String!, $n: Int!) { publication(host: $h) { title posts(first: $n) { edges { node { title brief url } } } } }", { h: host, n });
}
export function getUser(username) {
    return gql("query($u: String!) { user(username: $u) { name bio } }", { u: username });
}
export function publicationInfo(host) {
    return gql("query($h: String!) { publication(host: $h) { title displayTitle about { markdown } } }", { h: host });
}
export function postDetails(host, slug) {
    return gql("query($h: String!, $s: String!) { publication(host: $h) { post(slug: $s) { title brief url readTimeInMinutes } } }", { h: host, s: slug });
}
export function seriesList(host, limit) {
    const n = Math.min(Number(limit ?? 5) || 5, 20);
    return gql("query($h: String!, $n: Int!) { publication(host: $h) { seriesList(first: $n) { edges { node { name slug } } } } }", { h: host, n });
}
export function tagInfo(slug) {
    return gql("query($s: String!) { tag(slug: $s) { name slug } }", { s: slug });
}
export function userStats(username) {
    return gql("query($u: String!) { user(username: $u) { name followersCount } }", { u: username });
}
export function userPublications(username) {
    return gql("query($u: String!) { user(username: $u) { publications(first: 5) { edges { node { title displayTitle } } } } }", { u: username });
}
export function publicationMembers(host) {
    return gql("query($h: String!) { publication(host: $h) { members(first: 10) { edges { node { role user { username name } } } } } }", { h: host });
}
// ---- muxG tools:
// Hashnode serves public posts and profiles without a PAT, so these two
// deliberately skip the token the existing helper insists on.
async function gqlPublic(query, variables = {}) {
    let res;
    try {
        res = await fetch("https://gql-beta.hashnode.com/", {
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new HashnodeError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new HashnodeError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    if (!text.trim())
        throw new HashnodeError("Hashnode returned an empty body.");
    return text.slice(0, 12000);
}
/**
 * How an author's posts actually performed. The engagement counters live on the
 * user query, which Hashnode serves without a plan.
 */
export async function authorEngagement(args) {
    const name = String(args?.username ?? '').trim();
    if (!name)
        throw new HashnodeError('Provide a Hashnode username.');
    const n = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 20);
    const data = await gqlPublic("query($u: String!, $n: Int!) { user(username: $u) { name posts(first: $n) { edges { node { title slug url reactionCount responseCount replyCount readTimeInMinutes publishedAt tags { name } } } } } }", { u: name, n });
    const parsed = JSON.parse(data);
    if (parsed.errors?.length) {
        throw new HashnodeError(`Hashnode refused the query: ${parsed.errors.map((e) => e.message ?? 'unknown').join('; ')}`);
    }
    const user = parsed.data?.user;
    if (!user)
        throw new HashnodeError(`No Hashnode user called "${name}".`);
    const edges = user.posts?.edges ?? [];
    if (!edges.length)
        throw new HashnodeError(`Hashnode lists no posts for "${name}".`);
    const rows = edges
        .map((edge) => edge.node)
        .filter((node) => Boolean(node));
    const totalReactions = rows.reduce((sum, row) => sum + (Number(row.reactionCount) || 0), 0);
    const totalComments = rows.reduce((sum, row) => sum + (Number(row.responseCount) || 0), 0);
    const best = rows.reduce((a, b) => ((Number(b.reactionCount) || 0) > (Number(a.reactionCount) || 0) ? b : a));
    const lines = [
        `${user.name ?? name} on Hashnode: ${rows.length} recent post(s), ${totalReactions} reaction(s) and ${totalComments} comment(s) in total`,
        best ? `Best received: "${String(best.title ?? '?').slice(0, 90)}" with ${best.reactionCount ?? 0} reaction(s).` : 'Best received: not reported',
        '',
    ];
    for (const [i, row] of rows.entries()) {
        const published = typeof row.publishedAt === 'string' ? Date.parse(row.publishedAt) : Number.NaN;
        const age = Number.isFinite(published) ? `${Math.round((Date.now() - published) / 86_400_000)}d ago` : 'date not reported';
        const tags = Array.isArray(row.tags) ? row.tags.map((t) => t.name ?? '?') : [];
        lines.push(`  ${i + 1}. ${String(row.title ?? 'untitled').slice(0, 100)}`);
        lines.push(`     ${row.reactionCount ?? 0} reaction(s) · ${row.responseCount ?? 0} comment(s) · ${row.replyCount ?? 0} reply(ies) · ${row.readTimeInMinutes ?? '?'} min read · ${age}${tags.length ? ` · ${tags.slice(0, 5).join(', ')}` : ''}`);
        if (row.url)
            lines.push(`     ${row.url}`);
    }
    return lines.join('\n');
}
/** The social and professional footprint of a Hashnode account. */
export async function userProfile(username) {
    const name = String(username ?? '').trim();
    if (!name)
        throw new Error('Provide a Hashnode username.');
    const data = await gqlPublic("query($u: String!) { user(username: $u) { name username tagline location availableFor socialMediaLinks { website twitter github linkedin instagram youtube } badges { name } } }", { u: name });
    const parsed = JSON.parse(data);
    if (parsed.errors?.length) {
        throw new Error(`Hashnode refused the query: ${parsed.errors.map((e) => e.message ?? 'unknown').join('; ')}`);
    }
    const user = parsed.data?.user;
    if (!user)
        throw new Error(`No Hashnode user called "${name}".`);
    const links = (user.socialMediaLinks ?? {});
    const filled = Object.entries(links)
        .filter(([, value]) => typeof value === 'string' && value !== '')
        .map(([network, value]) => ({ network, url: String(value) }));
    const badges = Array.isArray(user.badges) ? user.badges.map((b) => b.name ?? '?') : [];
    return JSON.stringify({
        user: user.name ?? name,
        username: user.username ?? name,
        tagline: user.tagline ?? 'not reported',
        location: user.location ?? 'not reported',
        available_for: user.availableFor ?? 'not reported',
        social_links: filled,
        badges,
    }, null, 2);
}
