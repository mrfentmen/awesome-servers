/**
 * Pure helpers - no playwright, no network. Unit-tested.
 */
/** Parse a Redbubble manage-portfolio link like /portfolio/images/184876324-big-pink-bow.../edit */
export function parseWorkHref(href) {
    const m = /\/portfolio\/images\/(\d+)-([a-z0-9-]+)/i.exec(href || '');
    if (!m)
        return null;
    return { id: m[1], slug: m[2] };
}
/** RB-style slugify of a title for cross-checking save redirects. */
export function slugifyTitle(title) {
    return String(title)
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[''`,]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}
/**
 * Redbubble tag limits: 1 main tag + up to 14 supporting tags, 50 chars each.
 * Dedupes (case-insensitive), trims whitespace, drops empties, respects caps.
 */
const RB_TAG_MAX_CHARS = 50;
const RB_SUPPORTING_MAX = 14;
const RB_TAG_MAX_TOTAL = 15;
export function buildRbTags(mainTag, supporting) {
    const warnings = [];
    const main = String(mainTag || '').trim().toLowerCase();
    if (!main)
        warnings.push('main tag is empty');
    if (main.length > RB_TAG_MAX_CHARS)
        warnings.push(`main tag exceeds ${RB_TAG_MAX_CHARS} chars`);
    const seen = new Set([main]);
    const extras = [];
    for (const raw of supporting) {
        const t = String(raw || '').trim().toLowerCase();
        if (!t)
            continue;
        if (t.length > RB_TAG_MAX_CHARS) {
            warnings.push(`tag too long, dropped: ${t}`);
            continue;
        }
        if (seen.has(t))
            continue;
        seen.add(t);
        extras.push(t);
    }
    if (extras.length > RB_SUPPORTING_MAX) {
        warnings.push(`trimmed to ${RB_SUPPORTING_MAX} supporting tags, dropped ${extras.length - RB_SUPPORTING_MAX}`);
    }
    const kept = extras.slice(0, RB_SUPPORTING_MAX);
    if (main && 1 + kept.length > RB_TAG_MAX_TOTAL) {
        warnings.push('total tags exceed platform cap');
    }
    return { main, supporting: kept, warnings };
}
/** TeePublic tag box takes a comma-separated string. */
export function tpTagsText(tags) {
    const seen = new Set();
    const out = [];
    for (const raw of tags) {
        const t = String(raw || '').trim();
        if (!t)
            continue;
        const k = t.toLowerCase();
        if (seen.has(k))
            continue;
        seen.add(k);
        out.push(t);
    }
    return out.join(', ').slice(0, 480);
}
/** Rough-title check used by both flows to pre-empt marketplace validation. */
export function validateTitle(title, minWords = 4, maxWords = 8) {
    const words = String(title || '').trim().split(/\s+/).filter(Boolean);
    const warns = [];
    if (words.length < 1)
        warns.push('title is empty');
    if (words.length < minWords)
        warns.push(`title shorter than ${minWords} descriptive words`);
    if (words.length > maxWords + 4)
        warns.push('title is very long for search');
    if (/(&lt;|&gt;|<|>|")/.test(title || ''))
        warns.push('title contains markup-like characters');
    return warns;
}
