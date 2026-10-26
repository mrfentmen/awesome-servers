export class ResendError extends Error {
    constructor(message) {
        super(message);
        this.name = "ResendError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.RESEND_API_KEY;
    if (!k)
        throw new ResendError("Set RESEND_API_KEY (Resend dashboard).");
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://api.resend.com" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new ResendError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new ResendError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 8000);
}
export function listDomains() {
    return get("/domains");
}
export function getDomain(domainId) {
    return get(`/domains/${encodeURIComponent(domainId)}`);
}
export function getEmail(emailId) {
    return get(`/emails/${encodeURIComponent(emailId)}`);
}
export function listApiKeys() {
    return get("/api-keys/list");
}
export function listAudiences() {
    return get("/audiences");
}
export function getAudience(audienceId) {
    return get(`/audiences/${encodeURIComponent(audienceId)}`);
}
export function listContacts(audienceId) {
    return get(`/audiences/${encodeURIComponent(audienceId)}/contacts`);
}
export function listBroadcasts() {
    return get("/broadcasts");
}
export function getBroadcast(broadcastId) {
    return get(`/broadcasts/${encodeURIComponent(broadcastId)}`);
}
export function createContact(audienceId, email) {
    return (async () => {
        let res;
        try {
            res = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`, {
                method: "POST",
                headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
                body: JSON.stringify({ email }),
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            throw new ResendError(`Network error: ${e.message}`);
        }
        const text = await res.text();
        if (!res.ok)
            throw new ResendError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text.slice(0, 4000);
    })();
}
export function addDomain(name) {
    return (async () => {
        let res;
        try {
            res = await fetch("https://api.resend.com/domains", {
                method: "POST",
                headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
                body: JSON.stringify({ name }),
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            throw new ResendError(`Network error: ${e.message}`);
        }
        const text = await res.text();
        if (!res.ok)
            throw new ResendError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text.slice(0, 4000);
    })();
}
// ---- muxH tools:
// The tools above hand JSON to the Resend API and read JSON back. These two
// work on the message itself, which is what actually gets signed and delivered:
// the exact MIME bytes a multipart message comes to, and the exact bytes DKIM
// will hash. Both are computed locally and are byte-checkable.
import { createHash } from "node:crypto";
const CRLF = "\r\n";
function base64Body(text) {
    return Buffer.from(text.replace(/\r\n/g, "\n"), "utf8").toString("base64").replace(/(.{76})/g, "$1" + CRLF).replace(new RegExp(CRLF + "$"), "");
}
const lineLength = (value) => Buffer.byteLength(value, "utf8");
const countOctets = (value) => Buffer.byteLength(value, "utf8");
/**
 * Build the MIME message a multipart email actually is, and report its exact
 * size, its boundaries and the encoding of every part. A JSON body sent to an
 * API is not what lands in the recipient's mailbox; this is.
 */
export async function buildMimeMessage(args) {
    const from = String(args.from ?? "").trim();
    const to = String(args.to ?? "").trim();
    const subject = String(args.subject ?? "").trim();
    if (!from || !to)
        throw new ResendError("Both from and to are required.");
    if (!subject)
        throw new ResendError("A subject is required.");
    const text = args.text ?? "";
    const html = args.html ?? "";
    if (!text && !html)
        throw new ResendError("Give at least one of text or html; an empty message has nothing to deliver.");
    const seed = createHash("sha256").update(`${from}|${to}|${subject}|${text}|${html}`).digest("hex").slice(0, 24);
    const outer = `----=_Part_${seed}_outer`;
    const inner = `----=_Part_${seed}_alt`;
    const parts = [];
    if (text)
        parts.push({ kind: "text", content: text, boundary: "", headers: [] });
    if (html)
        parts.push({ kind: "html", content: html, boundary: "", headers: [] });
    const headers = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        args.reply_to ? `Reply-To: ${String(args.reply_to).trim()}` : "",
        `Date: ${args.date ? String(args.date).trim() : new Date().toUTCString()}`,
        `Message-ID: ${args.message_id ? String(args.message_id).trim() : `<${seed}@mcp.local>`}`,
        "MIME-Version: 1.0",
    ].filter(Boolean);
    const alternative = parts.length > 1;
    const bodyLines = [];
    if (alternative) {
        bodyLines.push(`--${inner}`);
        bodyLines.push('Content-Type: text/plain; charset="utf-8"');
        bodyLines.push("Content-Transfer-Encoding: base64");
        bodyLines.push("");
        bodyLines.push(base64Body(text));
        bodyLines.push(`--${inner}`);
        bodyLines.push('Content-Type: text/html; charset="utf-8"');
        bodyLines.push("Content-Transfer-Encoding: base64");
        bodyLines.push("");
        bodyLines.push(base64Body(html));
        bodyLines.push(`--${inner}--`);
    }
    else {
        const only = parts[0];
        bodyLines.push('Content-Type: text/plain; charset="utf-8"');
        bodyLines.push("Content-Transfer-Encoding: base64");
        bodyLines.push("");
        bodyLines.push(base64Body(only.content));
    }
    const headersWithType = alternative
        ? [...headers, `Content-Type: multipart/alternative; boundary="${inner}"`]
        : [...headers, 'Content-Type: text/plain; charset="utf-8"'];
    const wire = [...headersWithType, alternative ? "" : "Content-Transfer-Encoding: base64", "", ...bodyLines].join(CRLF) + CRLF;
    const plainOctets = countOctets(text);
    const htmlOctets = countOctets(html);
    const longestHeader = headersWithType.reduce((max, line) => Math.max(max, lineLength(line)), 0);
    return [
        "MIME message as it would go on the wire (CRLF line endings, no trailing dot-stuffing applied)",
        "",
        `  From:        ${from}`,
        `  To:          ${to}`,
        `  Subject:     ${subject.length > 78 ? `${subject.slice(0, 78)}… (${subject.length} characters, over the 78-character recommendation)` : subject}`,
        `  MIME-Version: 1.0`,
        alternative
            ? `  Content-Type: multipart/alternative, boundary ${inner}`
            : "  Content-Type: text/plain; charset=utf-8",
        "",
        "Parts:",
        ...(alternative
            ? [
                `  1. text/plain, base64 — ${plainOctets.toLocaleString()} octets of source, ${base64Body(text).length.toLocaleString()} encoded`,
                `  2. text/html, base64 — ${htmlOctets.toLocaleString()} octets of source, ${base64Body(html).length.toLocaleString()} encoded`,
                "  A client that cannot render HTML shows the text part, so the plain part is not optional.",
            ]
            : [`  1. text/plain, base64 — ${plainOctets.toLocaleString()} octets of source, ${base64Body(text).length.toLocaleString()} encoded`]),
        "",
        `  total message size: ${countOctets(wire).toLocaleString()} octets (${(countOctets(wire) / 1024).toFixed(1)} KiB)`,
        `  headers: ${headersWithType.length}, longest header line ${longestHeader} characters`,
        `  boundary length: ${inner.length} characters, so ${outer === inner ? "reused" : "unique per message"} per message`,
        "",
        "Sanity limits a receiving server will apply:",
        countOctets(wire) > 10485760
            ? "  the message is over 10 MiB, which many providers will truncate or reject outright"
            : "  comfortably under the 10 MiB that SMTP servers commonly accept",
        subject.length > 998
            ? "  the subject exceeds the 998-character limit in RFC 5322, so it will be rejected"
            : `  the subject is within the 998-character RFC 5322 limit`,
        htmlOctets > 102400
            ? "  the HTML part is over 100 KiB, which Gmail will clip and mark as clipped"
            : "  the HTML part is within the 102 KiB Gmail clips at",
        "",
        "Assembled from the supplied fields; nothing was sent and no address was contacted.",
    ].join("\n");
}
const relaxHeader = (line) => line.replace(new RegExp(`${CRLF}[ \\t]+`, "g"), " ").replace(new RegExp(CRLF, "g"), "");
const simpleHeader = (line) => line.replace(new RegExp(CRLF, "g"), "");
/**
 * Exactly what a DKIM signer will hash: the relaxed and simple canonical forms
 * of the body and of the signed header list, with the SHA-256 bh= value. When a
 * signature fails, this is how the two sides are compared.
 */
export async function dkimCanonicalization(args) {
    const headers = Array.isArray(args.headers) ? args.headers.map((line) => String(line).replace(/\r?\n/g, CRLF)) : [];
    if (!headers.length)
        throw new ResendError("Give the header block that would be signed, one header per line.");
    if (headers.some((line) => !line.includes(":"))) {
        throw new ResendError("Every header line must look like 'Name: value'; a folded continuation line is allowed inside a value.");
    }
    const rawBody = String(args.body ?? "").replace(/\r?\n/g, CRLF);
    const algorithm = (args.hash ?? "sha256").toLowerCase();
    if (!["sha1", "sha256"].includes(algorithm)) {
        throw new ResendError("hash must be sha1 or sha256; those are the two DKIM permits with a hash= value.");
    }
    const digest = (value) => createHash(algorithm).update(value, "utf8").digest("base64");
    // RFC 6376 3.4.3 simple: remove every CRLF at the end of the body.
    const simpleBody = rawBody.replace(new RegExp(`${CRLF}+$`, "g"), "");
    // RFC 6376 3.4.4 relaxed: also ignore all WSP at the end of lines, and
    // reduce every WSP run inside a line to a single space.
    const relaxedBody = simpleBody.replace(/[ \t]+/g, " ").replace(new RegExp(`${CRLF}+$`, "g"), "");
    const relaxedHeaders = headers.map(relaxHeader).join(CRLF) + CRLF;
    const simpleHeaders = headers.map(simpleHeader).join(CRLF) + CRLF;
    const folded = headers.filter((line) => new RegExp(`${CRLF}[ \\t]`).test(line)).length;
    const nonAscii = [...rawBody].some((ch) => ch.charCodeAt(0) > 126);
    return [
        `DKIM canonicalisation (${algorithm}) over ${headers.length} header(s) and ${countOctets(rawBody).toLocaleString()} body octet(s)`,
        "",
        "Body:",
        `  source        ${countOctets(rawBody).toLocaleString()} octets, ${rawBody.split(CRLF).length} line(s)${folded ? "" : ", no folded lines"}`,
        `  simple        ${countOctets(simpleBody).toLocaleString()} octets — only the trailing CRLFs removed`,
        `  relaxed       ${countOctets(relaxedBody).toLocaleString()} octets — trailing whitespace stripped and internal WSP runs collapsed`,
        `    difference: ${countOctets(simpleBody) - countOctets(relaxedBody)} octet(s)`,
        "",
        `  bh= (simple)   bh=${digest(simpleBody)}`,
        `  bh= (relaxed)  bh=${digest(relaxedBody)}`,
        "",
        "Signed header block:",
        `  simple  ${countOctets(simpleHeaders).toLocaleString()} octets, one CRLF after each header`,
        `  relaxed ${countOctets(relaxedHeaders).toLocaleString()} octets — continuation lines unfolded, trailing WSP removed`,
        `  h= header hash (relaxed)  h=${digest(relaxedHeaders)}`,
        "",
        "Header order as given, which is the order the signature will use:",
        ...headers.map((line, i) => `  ${String(i + 1).padStart(2)}. ${line.slice(0, 80)}`),
        "",
        "Where signing usually goes wrong:",
        folded ? "  a header in this block is folded, so the simple and relaxed forms of it differ" : "  no header is folded, so simple and relaxed agree on the header block",
        nonAscii ? "  the body contains non-ASCII, so any transport that re-encodes it changes bh=" : "  the body is pure printable ASCII, so the two body forms can only differ on trailing whitespace",
        "  bh= must be computed over the body after any quoted-printable transfer encoding, not over the decoded text.",
        "",
        "Computed locally with node:crypto; the digests are the exact values a signer would produce.",
    ].join("\n");
}
