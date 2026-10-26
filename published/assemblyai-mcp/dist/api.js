export class AssemblyError extends Error {
    constructor(message) {
        super(message);
        this.name = "AssemblyError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.assemblyai.com/v2";
function headers() {
    const k = process.env.ASSEMBLYAI_API_KEY;
    if (!k)
        throw new AssemblyError("Set ASSEMBLYAI_API_KEY (free AssemblyAI tier).");
    return { ...UA, Accept: "application/json", Authorization: k };
}
async function get(path) {
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new AssemblyError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new AssemblyError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function listTranscripts(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/transcript?limit=${n}`);
}
export function getTranscript(transcriptId) {
    return get(`/transcript/${encodeURIComponent(transcriptId)}`);
}
export function getParagraphs(transcriptId) {
    return get(`/transcript/${encodeURIComponent(transcriptId)}/paragraphs`);
}
