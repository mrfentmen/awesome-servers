const m0 = (() => {
    const UA = 'mrfentmen-rainviewer-mcp/1.0';
    async function radar(_args) {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`RainViewer returned ${res.status}`);
        const d = (await res.json());
        const radar = d.radar ?? {};
        const when = (t) => (t ? new Date(t * 1000).toISOString() : '?');
        return [
            `RainViewer radar (version ${d.version ?? '?'}):`,
            `Host: ${d.host ?? '?'}`,
            `Past frames: ${(radar.past ?? []).length} | nowcast: ${(radar.nowcast ?? []).length} | forecast: ${(radar.forecast ?? []).length}`,
            `Generated: ${when(d.generated)}`,
        ].filter(Boolean).join('\n');
    }
    return { radar };
})();
const m1 = (() => {
    const UA = "mrfentmen-rain-radar-mcp/1.0 (https://github.com/mrfentmen)";
    class RadarError extends Error {
    }
    async function timeline(_args) {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new RadarError(`RainViewer returned HTTP ${res.status}`);
        const d = (await res.json());
        const past = d.radar?.past ?? [];
        const nowcast = d.radar?.nowcast ?? [];
        return [
            `Radar host: ${d.host}`,
            `Version: ${d.version}`,
            `Past frames: ${past.length}`,
            `Nowcast frames: ${nowcast.length}`,
            "",
            "Frame paths (append to host):",
            ...past.slice(0, 3).map((f, i) => `  past[${i}] ${f.path} at ${new Date(f.time * 1000).toISOString().slice(11, 16)}Z`),
            ...nowcast.slice(0, 3).map((f, i) => `  nowcast[${i}] ${f.path} at ${new Date(f.time * 1000).toISOString().slice(11, 16)}Z`),
        ].join("\n");
    }
    return { RadarError, timeline };
})();
export const RadarError = m1.RadarError;
export const radar = m0.radar;
export const timeline = m1.timeline;
export const m0_radar = m0.radar;
export const m1_timeline = m1.timeline;
export const m1_RadarError = m1.RadarError;
// ---- muxC tools:
/**
 * RainViewer serves radar as 256px XYZ tiles. The API only hands out the host
 * and a frame path, so a client has to build the tile URL itself; this does the
 * slippy-map maths from a latitude and longitude and reports the exact tiles.
 */
function lonToTileX(lon, zoom) {
    return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}
function latToTileY(lat, zoom) {
    const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
    const rad = (clamped * Math.PI) / 180;
    return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom);
}
async function rainViewerMaps() {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
        headers: { "User-Agent": "mrfentmen-rainviewer-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new RadarError(`RainViewer returned HTTP ${res.status}`);
    return (await res.json());
}
