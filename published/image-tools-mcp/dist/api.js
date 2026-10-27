import sharp from "sharp";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
export class ImageError extends Error {
}
function outPath(name) {
    const safe = /^[\w.\- ]+$/.test(name) ? name : `resized-${Date.now()}.jpg`;
    return join(mkdtempSync(join(tmpdir(), "img-")), safe);
}
export async function resizeImage(args) {
    const src = args.path ?? "";
    if (!src)
        throw new ImageError("Provide a path to an image");
    const width = Math.min(Math.max(args.width ?? 800, 16), 8000);
    const out = outPath(args.filename ?? `resized-${Date.now()}.jpg`);
    await sharp(src).resize({ width, withoutEnlargement: true }).toFile(out);
    const size = statSync(out).size;
    return `Created ${out} (${size} bytes, width ${width})`;
}
export async function inspectImage(args) {
    const src = args.path ?? "";
    if (!src)
        throw new ImageError("Provide a path to an image");
    const meta = await sharp(src).metadata();
    return `Format: ${meta.format}\nWidth: ${meta.width}\nHeight: ${meta.height}\nChannels: ${meta.channels}\nSize: ${(statSync(src).size / 1024).toFixed(1)} KB\nHas alpha: ${meta.hasAlpha}`;
}
// ---- muxC tools:
const UA = "mrfentmen-image-tools-mcp/1.0 (https://github.com/mrfentmen)";
const FORMATS = ["jpeg", "png", "webp", "avif", "tiff", "gif"];
function tmpFile(name) {
    const safe = /^[\w.\- ]+$/.test(name) ? name : `image-${Date.now()}.bin`;
    return join(mkdtempSync(join(tmpdir(), "img-")), safe);
}
async function download(url) {
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        throw new ImageError(`"${url}" is not a valid url; include the scheme, e.g. https://example.com/photo.jpg`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
        throw new ImageError("Only http and https urls can be downloaded");
    const res = await fetch(parsed.toString(), { headers: { "User-Agent": UA, Accept: "image/*,*/*" }, redirect: "follow", signal: AbortSignal.timeout(30000) });
    if (!res.ok)
        throw new ImageError(`${res.status} ${res.statusText} fetching the image from ${parsed.hostname}`);
    const type = res.headers.get("content-type") ?? "not reported";
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length === 0)
        throw new ImageError("the server returned an empty body");
    if (bytes.length > 25 * 1024 * 1024)
        throw new ImageError(`that image is ${(bytes.length / 1048576).toFixed(1)} MB, over this tool's 25 MB limit`);
    return { bytes, type };
}
/** Download an image from a url and report what it actually is, without writing anything. */
export async function probeUrl(args) {
    const url = (args.url ?? "").trim();
    if (!url)
        throw new ImageError("Provide an image url to probe");
    const { bytes, type } = await download(url);
    const meta = await sharp(bytes).metadata();
    return [
        `${url}`,
        `content type: ${type} | bytes: ${bytes.length}`,
        `decoded as: ${meta.format ?? "not a format sharp recognises"} ${meta.width ?? "?"}x${meta.height ?? "?"} | channels ${meta.channels ?? "?"} | alpha ${meta.hasAlpha ? "yes" : "no"}`,
        `density ${meta.density ?? "not reported"} | orientation ${meta.orientation ?? "not reported"} | pages ${meta.pages ?? 1}`,
    ].join("\n");
}
/** Download an image from a url, convert it to another format and write it to a temp file. */
export async function convertUrlImage(args) {
    const url = (args.url ?? "").trim();
    if (!url)
        throw new ImageError("Provide an image url to convert");
    const format = (args.format ?? "webp").trim().toLowerCase();
    if (!FORMATS.includes(format))
        throw new ImageError(`format must be one of ${FORMATS.join(", ")}`);
    const { bytes, type } = await download(url);
    // Read the source format before converting, or the report describes the output.
    const sourceMeta = await sharp(bytes).metadata();
    const width = args.width ? Math.min(Math.max(args.width, 1), 8000) : undefined;
    const ext = format === "jpeg" ? "jpg" : format;
    const name = args.filename ?? `converted-${Date.now()}.${ext}`;
    const out = tmpFile(name);
    let pipeline = sharp(bytes);
    if (width)
        pipeline = pipeline.resize({ width, withoutEnlargement: true });
    if (format === "jpeg")
        pipeline = pipeline.flatten({ background: "#ffffff" });
    await pipeline.toFormat(format).toFile(out);
    const meta = await sharp(out).metadata();
    return [
        `Converted ${url} to ${format}.`,
        `wrote ${out} (${statSync(out).size} bytes, ${meta.width}x${meta.height})`,
        `source was ${bytes.length} bytes served as ${type}, decoding as ${sourceMeta.format ?? "unknown"} ${sourceMeta.width}x${sourceMeta.height}`,
    ].join("\n");
}
