const BASE = "https://api.mymemory.translated.net/get";
const UA = "mrfentmen-translation-mcp/1.0 (https://github.com/mrfentmen)";
export class TransError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new TransError(`MyMemory error ${res.status}`);
    return (await res.json());
}
export async function translate(args) {
    const text = (args.text ?? "").slice(0, 2000);
    if (!text.trim())
        throw new TransError("Provide text to translate");
    const from = (args.from ?? "en").toLowerCase();
    const to = (args.to ?? "es").toLowerCase();
    const d = await get(`${BASE}?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
    if (d.responseStatus !== 200) {
        throw new TransError(d.responseDetails ?? `MyMemory error ${d.responseStatus}`);
    }
    const out = d.responseData?.translatedText ?? "";
    const quota = d.quotaFinished ? " (free daily quota reached)" : "";
    return `${out}${quota}\n\nMatch: ${Math.round((d.responseData?.match ?? 0) * 100)}%`;
}
export async function detectAndTranslate(args) {
    return translate({ text: args.text, from: "autodetect", to: args.to });
}
// ---- muxC tools:
