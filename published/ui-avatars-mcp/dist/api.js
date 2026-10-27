const BASE = 'https://ui-avatars.com/api/';
export async function avatar(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a name or initials.';
    const size = Math.min(Math.max(Number(args.size ?? 128) || 128, 16), 512);
    const url = `${BASE}?name=${encodeURIComponent(name)}&size=${size}`;
    // Verify the avatar endpoint responds.
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-ui-avatars-mcp/1.0', Accept: 'image/png' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`UI Avatars returned ${res.status}`);
    return [
        `UI Avatar for "${name}":`,
        `URL: ${url}`,
        `Size: ${size}x${size}px (PNG)`,
    ].join('\n');
}
// ---- muxB tools:
import { createHash } from 'node:crypto';
const GRAVATAR_ROOT = 'https://www.gravatar.com/avatar';
const GRAVATAR_UA = 'mrfentmen-ui-avatars-mcp/1.0';
const FALLBACKS = ['404', 'mp', 'identicon', 'retro', 'robohash', 'blank'];
const RATINGS = ['g', 'pg', 'r', 'x'];
const FORMATS = ['jpg', 'png', 'gif'];
function normaliseEmail(raw) {
    return (raw ?? '').trim().toLowerCase();
}
function gravatarHash(email) {
    return createHash('md5').update(normaliseEmail(email)).digest('hex');
}
export async function gravatarProfile(args) {
    const email = normaliseEmail(args.email);
    if (!email)
        return 'Provide an email address.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        return `"${email}" does not look like an email address.`;
    const hash = gravatarHash(email);
    const res = await fetch(`https://www.gravatar.com/${hash}.json`, {
        headers: { 'User-Agent': GRAVATAR_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404) {
        return `No public Gravatar profile is registered for ${email} (hash ${hash}).`;
    }
    if (!res.ok)
        throw new Error(`Gravatar returned ${res.status}`);
    const data = (await res.json());
    const entry = (data.entry ?? [])[0];
    if (!entry)
        return `Gravatar returned no profile entry for ${email} (hash ${hash}).`;
    const lines = [
        `Public Gravatar profile for ${email} (request hash ${hash}):`,
        `Display name: ${entry.displayName ?? 'not reported'}`,
        `Username: ${entry.preferredUsername ?? 'not reported'}`,
        `Location: ${entry.currentLocation ?? 'not reported'}`,
        `Profile URL: ${entry.profileUrl ?? 'not reported'}`,
        `Avatar: ${entry.thumbnailUrl ?? 'not reported'}`,
    ];
    if (entry.aboutMe)
        lines.push(`About: ${String(entry.aboutMe).replace(/\s+/g, ' ').slice(0, 200)}`);
    return lines.join('\n');
}
