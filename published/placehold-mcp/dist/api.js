const BASE = 'https://placehold.co';
export async function image(args) {
    const width = Math.min(Math.max(Number(args?.width ?? 600) || 600, 16), 2048);
    const height = Math.min(Math.max(Number(args?.height ?? width) || width, 16), 2048);
    const text = (args?.text ?? '').trim();
    const base = `${width}x${height}`;
    const url = text ? `${BASE}/${base}?text=${encodeURIComponent(text)}` : `${BASE}/${base}`;
    // Verify the endpoint responds.
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-placehold-mcp/1.0', Accept: 'image/svg+xml' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Placehold.co returned ${res.status}`);
    return [
        `Placeholder image:`,
        `URL: ${url}`,
        `Size: ${width}x${height}px (SVG)`,
        text ? `Label: "${text}"` : null,
    ].filter(Boolean).join('\n');
}
// ---- muxC tools:
class PlaceholdError extends Error {
}
