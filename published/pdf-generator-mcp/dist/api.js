import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
export class PdfError extends Error {
}
function outPath(name) {
    const safe = /^[\w.\- ]+$/.test(name) && name.endsWith(".pdf") ? name : `doc-${Date.now()}.pdf`;
    return join(mkdtempSync(join(tmpdir(), "pdfgen-")), safe);
}
async function wrapLines(pdf, font, text, maxWidth) {
    const lines = [];
    for (const raw of text.split("\n")) {
        let cur = "";
        for (const word of raw.split(" ")) {
            const test = cur ? `${cur} ${word}` : word;
            if (font.widthOfTextAtSize(test, 11) > maxWidth && cur) {
                lines.push(cur);
                cur = word;
            }
            else {
                cur = test;
            }
        }
        lines.push(cur);
    }
    return lines;
}
export async function createPdf(args) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([612, 792]);
    page.drawText(args.title ?? "Untitled", { x: 60, y: 740, size: 24, font: bold, color: rgb(0.1, 0.1, 0.1) });
    let y = 700;
    const bodyLines = await wrapLines(pdf, font, args.body ?? "", 492);
    for (const line of bodyLines) {
        if (y < 60) {
            pdf.addPage([612, 792]);
            y = 740;
        }
        if (line.trim()) {
            pdf.getPage(pdf.getPageCount() - 1).drawText(line.slice(0, 110), { x: 60, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
        }
        y -= 16;
    }
    const bytes = await pdf.save();
    const path = outPath(args.filename ?? `doc-${Date.now()}.pdf`);
    writeFileSync(path, bytes);
    return `Created ${path} (${bytes.length} bytes, ${pdf.getPageCount()} pages)`;
}
export async function createReport(args) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([612, 792]);
    page.drawText(args.title ?? "Report", { x: 60, y: 740, size: 26, font: bold });
    let y = 700;
    if (args.author) {
        page.drawText(`By ${args.author}`, { x: 60, y, size: 12, font });
        y -= 30;
    }
    const bullets = (args.bullets ?? "").split(",").map((b) => b.trim()).filter(Boolean);
    for (const b of bullets) {
        if (y < 60)
            break;
        page.drawText(`- ${b.slice(0, 90)}`, { x: 60, y, size: 11, font });
        y -= 18;
    }
    const bytes = await pdf.save();
    const path = outPath(`report-${Date.now()}.pdf`);
    writeFileSync(path, bytes);
    return `Created ${path} (${bytes.length} bytes)`;
}
// ---- muxC tools:
const PDF_UA = "mrfentmen-pdf-generator-mcp/1.0 (https://github.com/mrfentmen)";
/** Fetch a page over http and render its readable text into a pdf file. */
export async function urlToPdf(args) {
    const url = (args.url ?? "").trim();
    if (!url)
        throw new Error("Provide a url to fetch and render");
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        throw new Error(`"${url}" is not a valid url; include the scheme, e.g. https://example.com/article`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
        throw new Error("Only http and https urls can be fetched");
    const res = await fetch(parsed.toString(), { headers: { "User-Agent": PDF_UA, Accept: "text/html,application/xhtml+xml" }, redirect: "follow", signal: AbortSignal.timeout(30000) });
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText} fetching ${parsed.hostname}`);
    const type = res.headers.get("content-type") ?? "not reported";
    if (!/text\/html|application\/xhtml/i.test(type))
        throw new Error(`${parsed.hostname} answered ${type}, not HTML`);
    const html = await res.text();
    const title = (args.title ?? "").trim() || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || parsed.hostname);
    const body = html
        .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    const max = Math.max(500, Math.min(args.maxChars ?? 20000, 200000));
    const text = body.length > max ? `${body.slice(0, max)}\n[truncated at ${max} characters]` : body;
    if (!text)
        throw new Error(`${parsed.hostname} answered ${type} but the page had no readable text`);
    const out = await createPdf({ title, body: text });
    return `Fetched ${res.url || parsed.toString()} (${html.length} bytes of HTML, ${text.length} characters of text).\nRendered "${title}" to ${out}`;
}
