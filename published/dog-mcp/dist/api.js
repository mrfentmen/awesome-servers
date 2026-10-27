const CEO_BASE = 'https://dog.ceo/api';
const DOGAPI_BASE = 'https://dogapi.dog/api/v2';
const RANDOM_BASE = 'https://random.dog';
const UA = 'mrfentmen-dog-mcp/1.0 (https://github.com/mrfentmen)';
export class DogError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new DogError('dog.ceo rate limit hit, wait and retry');
    if (!res.ok)
        throw new DogError(`Dog API error ${res.status}`);
    return (await res.json());
}
export async function listBreeds(_args = {}) {
    const d = await get(`${CEO_BASE}/breeds/list/all`);
    const breeds = d.message ?? {};
    const names = Object.entries(breeds)
        .map(([breed, subs]) => (subs.length ? `${breed} (${subs.join(', ')})` : breed));
    return `${names.length} breeds\n${names.slice(0, 60).join('\n')}`;
}
export async function randomImage(args) {
    const breed = (args.breed ?? '').trim().toLowerCase();
    const url = breed
        ? `${CEO_BASE}/breed/${encodeURIComponent(breed)}/images/random`
        : `${CEO_BASE}/breeds/image/random`;
    const d = await get(url);
    if (d.status === 'error')
        throw new DogError(d.message ?? `Breed "${breed}" not found`);
    return `Random dog photo${breed ? ` (${breed})` : ''}: ${d.message ?? 'no image returned'}`;
}
export async function breedImages(args) {
    const breed = (args.breed ?? '').trim().toLowerCase();
    if (!breed)
        throw new DogError('Provide a breed name');
    const limit = Math.max(1, Math.min(args.limit ?? 3, 8));
    const d = await get(`${CEO_BASE}/breed/${encodeURIComponent(breed)}/images/random/${limit}`);
    if (d.status === 'error')
        throw new DogError((d.message ?? []).join(', ') || `Breed "${breed}" not found`);
    return `${breed} (${(d.message ?? []).length} images):\n${(d.message ?? []).join('\n')}`;
}
export async function facts(args) {
    const n = Math.max(1, Math.min(args.limit ?? 1, 10));
    const d = await get(`${DOGAPI_BASE}/facts?limit=${n}`);
    const list = (d.data ?? []).map((f) => f.attributes.body).filter(Boolean);
    if (!list.length)
        return 'No dog facts available right now.';
    return list.map((f, i) => `${i + 1}. ${f}`).join('\n');
}
export async function randomMedia(_args = {}) {
    const res = await fetch(`${RANDOM_BASE}/woof.json`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new DogError(`random.dog returned ${res.status}`);
    const d = (await res.json());
    return [
        `Random dog:`,
        `URL: ${d.url ?? '?'}`,
        d.fileSizeBytes ? `Size: ${(d.fileSizeBytes / 1024).toFixed(0)} KB` : null,
        d.urlSuffix ? `Suffix: ${d.urlSuffix}` : null,
    ].filter(Boolean).join('\n');
}
// The list endpoint accepts a page size large enough to return every breed in
// one request, so filters and name lookups do not have to page through 95 pages.
async function allDogBreeds() {
    const d = await get(`${DOGAPI_BASE}/breeds?page%5Bsize%5D=300`);
    return d.data ?? [];
}
export async function breedGroups(args) {
    const d = await get(`${DOGAPI_BASE}/groups`);
    const groups = d.data ?? [];
    if (!groups.length)
        return 'dogapi.dog returned no breed groups.';
    const wanted = (args.group ?? '').trim().toLowerCase();
    if (wanted) {
        const group = groups.find((g) => (g.attributes?.name ?? '').toLowerCase().includes(wanted));
        if (!group) {
            const known = groups.map((g) => g.attributes?.name).filter(Boolean).join(', ');
            return `No dogapi.dog group matched "${args.group}". Known groups: ${known}.`;
        }
        const ids = (group.relationships?.breeds?.data ?? [])
            .map((r) => r.id)
            .filter((id) => typeof id === 'string' && id.length > 0);
        // Group membership arrives as bare ids, so the breed list is fetched to
        // turn them back into names.
        const breeds = await allDogBreeds();
        const names = ids
            .map((id) => breeds.find((b) => b.id === id)?.attributes?.name)
            .filter((n) => typeof n === 'string' && n.length > 0)
            .sort((a, b) => a.localeCompare(b));
        const shown = names.slice(0, 40);
        const tail = names.length > shown.length ? [`      ...and ${names.length - shown.length} more`] : [];
        return [
            `${group.attributes?.name ?? args.group} — ${ids.length} breeds:`,
            ...shown.map((n) => `      ${n}`),
            ...tail,
        ].join('\n');
    }
    return [
        `dogapi.dog breed groups (${groups.length}):`,
        ...groups.map((g) => {
            const count = (g.relationships?.breeds?.data ?? []).length;
            return `      ${(g.attributes?.name ?? '?').padEnd(28)} ${count} breeds`;
        }),
    ].join('\n');
}
