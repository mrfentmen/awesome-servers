/**
 * Cover Art Archive client, keyless.
 * Look up artwork for a MusicBrainz release or release-group MBID.
 * Docs: https://musicbrainz.org/doc/Cover_Art_Archive/API
 */
const BASE = "https://coverartarchive.org";
export class CoverArtError extends Error {
}
const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function fetchJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "coverartarchive-mcp/1.0", Accept: "application/json" },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new CoverArtError("No cover art archived for this MBID yet.");
    if (!res.ok)
        throw new CoverArtError(`Cover Art Archive error ${res.status}`);
    return (await res.json());
}
export async function getCover(mbid, kind) {
    const clean = mbid.trim().toLowerCase();
    if (!MBID.test(clean))
        throw new CoverArtError(`Not a valid MBID: "${mbid}". Find one with musicbrainz-mcp first.`);
    const data = await fetchJson(`${BASE}/${kind}/${clean}/`);
    const images = Array.isArray(data.images) ? data.images : [];
    const front = images.find((i) => i.front === true);
    const back = images.find((i) => i.back === true);
    return {
        mbid: clean,
        kind,
        front: front?.image,
        frontThumb: front?.thumbnails?.["500"] ?? front?.thumbnails?.small,
        back: back?.image,
        imageCount: images.length,
        allImages: images.map((i) => String(i.image)).slice(0, 10),
    };
}
export function frontUrl(mbid, kind, size = 500) {
    return `${BASE}/${kind}/${mbid.trim().toLowerCase()}/front-${size}`;
}
export function formatCover(c) {
    const lines = [
        `Cover art for ${c.kind} ${c.mbid} (${c.imageCount} image${c.imageCount === 1 ? "" : "s"} archived)`,
        c.front ? `Front: ${c.front}` : "No front cover archived.",
        c.frontThumb ? `Front thumbnail: ${c.frontThumb}` : "",
        c.back ? `Back: ${c.back}` : "",
        c.allImages.length > 1 ? `All images:\n- ${c.allImages.join("\n- ")}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxA tools:
const MBID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function coverIndex(mbid, kind) {
    const res = await fetch(`${BASE}/${kind}/${mbid}`, {
        headers: { "User-Agent": "coverartarchive-mcp/1.0", Accept: "application/json" },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new CoverArtError(`No cover art archived for this ${kind} MBID yet.`);
    if (!res.ok)
        throw new CoverArtError(`Cover Art Archive error ${res.status}`);
    return (await res.json());
}
export async function coverImageBytes(args) {
    const mbid = String(args.mbid ?? "").trim().toLowerCase();
    if (!MBID_RE.test(mbid))
        throw new CoverArtError("Provide a MusicBrainz MBID, a 36 character dashed UUID.");
    const size = Math.round(Number(args.size ?? 500));
    if (![250, 500, 1200].includes(size))
        return `Size must be 250, 500 or 1200, not ${args.size}.`;
    const d = await coverIndex(mbid, "release");
    const images = (d.images ?? []);
    if (!images.length)
        return `The Cover Art Archive holds no images for release ${mbid}.`;
    let target = images[0];
    if (args.image_id != null) {
        const found = images.find((i) => Number(i.id) === Number(args.image_id));
        if (!found)
            return `Image id ${args.image_id} is not in this release. Available: ${images.map((i) => i.id).join(", ")}.`;
        target = found;
    }
    const url = `${BASE}/release/${mbid}/${target.id}-${size}.jpg`;
    const res = await fetch(url, { headers: { "User-Agent": "coverartarchive-mcp/1.0" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new CoverArtError(`Could not fetch the ${size}px image: HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") ?? "unknown";
    // PNG and JPEG headers are enough to confirm the bytes really are an image.
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer.subarray(1, 4).toString("ascii") === "PNG";
    const dims = isJpeg ? jpegSize(buffer) : isPng ? pngSize(buffer) : null;
    return [
        `Cover image ${size}px for release ${mbid}, image id ${target.id}:`,
        `  served as ${type} | ${buffer.length.toLocaleString("en-US")} bytes${dims ? ` | ${dims.width} x ${dims.height} pixels` : ""}`,
        `  header check: ${isJpeg ? "valid JPEG SOI marker" : isPng ? "valid PNG signature" : "unrecognised image header"}`,
        `  final URL: ${res.url}`,
        `  archive page: ${target.image ?? "not reported"}`,
    ].join("\n");
}
function pngSize(b) {
    if (b.length < 24)
        return null;
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}
function jpegSize(b) {
    let i = 2;
    while (i < b.length - 9) {
        if (b[i] !== 0xff) {
            i += 1;
            continue;
        }
        const marker = b[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
            return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
        }
        i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
}
