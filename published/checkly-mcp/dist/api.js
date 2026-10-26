const UA = "mrfentmen-checkly-mcp/1.0";
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export function normalizeTarget(input) {
    const raw = (input ?? "").trim();
    if (!raw)
        throw new Error("Provide a URL or hostname, for example https://example.com.");
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let url;
    try {
        url = new URL(withScheme);
    }
    catch {
        throw new Error(`"${input}" is not a valid URL or hostname.`);
    }
    if (!url.hostname.includes("."))
        throw new Error(`"${input}" does not look like a public hostname.`);
    return url;
}
const METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"];
const methodOf = (value) => {
    const method = (value ?? "GET").trim().toUpperCase();
    if (!METHODS.includes(method))
        throw new Error(`Method must be one of ${METHODS.join(", ")}.`);
    return method;
};
async function fetchChain(target, timeoutMs = 20000, method = "GET") {
    const start = Date.now();
    let url = normalizeTarget(target);
    const hops = [];
    let res = null;
    // Redirects are followed by hand so every hop is visible; HEAD and OPTIONS keep
    // their method, other methods fall back to GET after the first hop so a redirect
    // does not turn into an unexpected write against the target.
    for (let i = 0; i < 6; i += 1) {
        const hopStart = Date.now();
        const useMethod = i === 0 ? method : "GET";
        res = await fetch(url, {
            method: useMethod,
            redirect: "manual",
            headers: { "User-Agent": UA, Accept: "*/*" },
            signal: AbortSignal.timeout(timeoutMs),
        });
        const location = res.headers.get("location");
        hops.push({ url: url.toString(), status: res.status, location, ms: Date.now() - hopStart });
        if (res.status >= 300 && res.status < 400 && location) {
            url = new URL(location, url);
            continue;
        }
        break;
    }
    if (!res)
        throw new Error("No response received.");
    const body = method === "HEAD" ? "" : await res.text();
    return {
        status: res.status,
        statusText: res.statusText,
        finalUrl: url.toString(),
        ms: Date.now() - start,
        headers: res.headers,
        html: body.slice(0, 200000),
        hops,
        bytes: Buffer.byteLength(body),
    };
}
export async function checkUrl(args) {
    const r = await fetchChain(args.url, 15000);
    const ok = r.status >= 200 && r.status < 400;
    return [
        `${ok ? "UP" : "DOWN"} — ${r.finalUrl}`,
        `HTTP ${r.status} ${r.statusText} in ${r.ms} ms`,
        `Server: ${r.headers.get("server") ?? "not disclosed"} | Content type: ${r.headers.get("content-type") ?? "unknown"}`,
        r.hops.length > 1 ? `Redirects: ${r.hops.length - 1}` : "Redirects: none",
        r.bytes ? `Body read: ${r.bytes} byte(s)` : "",
    ].filter(Boolean).join("\n");
}
/** Parses "200", "2xx", "200-204" or "200,204,301" into a matcher. */
function statusMatcher(expected) {
    const parts = expected.split(",").map((p) => p.trim()).filter(Boolean);
    if (!parts.length)
        throw new Error('Provide the status to expect, for example "200" or "2xx".');
    const tests = [];
    for (const part of parts) {
        const family = part.match(/^(\d)xx$/i);
        const range = part.match(new RegExp("^(\\d{3})\\s*-\\s*(\\d{3})$", ""));
        if (family) {
            const hundreds = Number(family[1]);
            tests.push((status) => Math.floor(status / 100) === hundreds);
        }
        else if (range) {
            const low = Number(range[1]);
            const high = Number(range[2]);
            tests.push((status) => status >= low && status <= high);
        }
        else if (new RegExp("^\\d{3}$", "").test(part)) {
            const exact = Number(part);
            tests.push((status) => status === exact);
        }
        else {
            throw new Error(`"${part}" is not a status match. Use 200, 2xx, 200-204 or a comma-separated list.`);
        }
    }
    return (status) => tests.some((t) => t(status));
}
const summarise = (title, checks) => {
    const passed = checks.filter((c) => c.passed).length;
    const verdict = passed === checks.length ? "PASSED" : "FAILED";
    const width = Math.max(...checks.map((c) => c.name.length));
    return [
        title,
        `${verdict} — ${passed} of ${checks.length} assertion(s) held`,
        "",
        ...checks.map((c) => `${c.passed ? "PASS" : "FAIL"} ${c.name.padEnd(width)}  ${c.detail}`),
    ].join("\n");
};
export async function assertStatus(args) {
    const method = methodOf(args.method);
    const matcher = statusMatcher(args.expected);
    const r = await fetchChain(args.url, 20000, method);
    const checks = [
        {
            name: "status",
            passed: matcher(r.status),
            detail: `HTTP ${r.status} (expected ${args.expected}) after ${r.ms} ms via ${method}`,
        },
        {
            name: "no loop",
            passed: r.hops.length < 6,
            detail: r.hops.length >= 6 ? "redirect chain hit the 6-hop limit, so it may never terminate" : `${r.hops.length} hop(s) to ${r.finalUrl}`,
        },
        {
            name: "speed",
            passed: r.ms <= 3000,
            detail: `${r.ms} ms to the final response (budget 3000 ms)`,
        },
    ];
    return summarise(`Synthetic check for ${normalizeTarget(args.url).toString()}`, checks);
}
export async function assertHeaders(args) {
    const r = await fetchChain(args.url, 20000);
    const checks = [];
    for (const name of (args.required ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean).slice(0, 15)) {
        const value = r.headers.get(name);
        checks.push({ name: `has ${name}`, passed: Boolean(value), detail: value ? value.slice(0, 160) : "header not sent" });
    }
    for (const name of (args.forbidden ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean).slice(0, 15)) {
        const value = r.headers.get(name);
        checks.push({ name: `no ${name}`, passed: !value, detail: value ? `leaked: ${value.slice(0, 160)}` : "not sent, as required" });
    }
    if (args.header) {
        const name = args.header.trim().toLowerCase();
        const value = r.headers.get(name);
        const wanted = args.contains ?? "";
        checks.push({
            name: `${name} contains`,
            passed: Boolean(value) && (!wanted || value.includes(wanted)),
            detail: value ? `${value.slice(0, 160)}${wanted ? ` (looking for "${wanted}")` : ""}` : "header not sent",
        });
    }
    if (!checks.length)
        return "Provide at least one of required (header names that must be present), forbidden (header names that must not be) or header plus contains.";
    return summarise(`Header assertions for ${r.finalUrl} (HTTP ${r.status})`, checks);
}
export async function assertContent(args) {
    const r = await fetchChain(args.url, 20000);
    const haystack = r.html.toLowerCase();
    const checks = [];
    for (const needle of (args.contains ?? []).map((s) => String(s)).filter(Boolean).slice(0, 15)) {
        checks.push({
            name: `contains "${needle.slice(0, 40)}"`,
            passed: haystack.includes(needle.toLowerCase()),
            detail: haystack.includes(needle.toLowerCase()) ? "found in the HTML" : "not present in the HTML",
        });
    }
    for (const needle of (args.notContains ?? []).map((s) => String(s)).filter(Boolean).slice(0, 15)) {
        checks.push({
            name: `no "${needle.slice(0, 40)}"`,
            passed: !haystack.includes(needle.toLowerCase()),
            detail: haystack.includes(needle.toLowerCase()) ? "found in the HTML, and it should not be there" : "absent, as required",
        });
    }
    if (!checks.length)
        return "Provide at least one string in contains (must appear) or notContains (must not appear).";
    return summarise(`Content assertions for ${r.finalUrl} (HTTP ${r.status})`, checks);
}
export async function checkRedirects(args) {
    const r = await fetchChain(args.url, 15000);
    const lines = [`Redirect chain for ${normalizeTarget(args.url).toString()} — ${r.hops.length} hop(s)`, ""];
    r.hops.forEach((hop, i) => {
        lines.push(`${i + 1}. ${hop.status} ${hop.url} (${hop.ms} ms)`);
        if (hop.location)
            lines.push(`     -> ${hop.location}`);
    });
    const seen = new Set();
    let loop = false;
    for (const hop of r.hops) {
        if (seen.has(hop.url))
            loop = true;
        seen.add(hop.url);
    }
    const insecureFirst = r.hops[0]?.url.startsWith("http://") ?? false;
    const endsSecure = r.finalUrl.startsWith("https://");
    const extra = r.hops.length - 1;
    lines.push("", `Final URL: ${r.finalUrl}`);
    lines.push(`Redirect loop: ${loop ? "YES — the chain revisits a URL" : "no"}`);
    lines.push(`Extra hops to remove: ${Math.max(extra - 1, 0)}`);
    if (insecureFirst)
        lines.push(`Starts on plain HTTP: yes ${endsSecure ? "and upgrades to HTTPS" : "and never upgrades to HTTPS"}`);
    if (r.hops.length >= 6)
        lines.push("Warning: the chain hit the 6-hop limit, so it may never terminate.");
    return lines.join("\n");
}
export async function brokenLinks(args) {
    const base = normalizeTarget(args.url);
    const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 40);
    const page = await fetchChain(base.toString(), 20000);
    const hrefs = [...page.html.matchAll(new RegExp("<a[^>]+href=[\"']([^\"'#]+)[\"']", "gi"))]
        .map((m) => m[1])
        .filter((href) => !/^(mailto:|tel:|javascript:|data:)/i.test(href));
    const unique = [];
    const seen = new Set();
    for (const href of hrefs) {
        let absolute;
        try {
            absolute = new URL(href, base).toString();
        }
        catch {
            continue;
        }
        if (seen.has(absolute))
            continue;
        seen.add(absolute);
        unique.push(absolute);
        if (unique.length >= limit)
            break;
    }
    if (!unique.length)
        return `No links found on ${page.finalUrl}.`;
    const rows = [];
    let broken = 0;
    // Sequential: a link check should not open many sockets to one host at once.
    for (const link of unique) {
        try {
            const res = await fetch(link, {
                method: "HEAD",
                redirect: "follow",
                headers: { "User-Agent": UA },
                signal: AbortSignal.timeout(12000),
            });
            const bad = res.status >= 400;
            if (bad)
                broken += 1;
            rows.push(`${bad ? "BROKEN" : "ok    "} ${res.status} ${link}`);
        }
        catch (e) {
            broken += 1;
            rows.push(`BROKEN --- ${link} (${errorMessage(e)})`);
        }
    }
    return [
        `Link check for ${page.finalUrl}`,
        `Checked ${unique.length} link(s) found on the page: ${broken} broken.`,
        "",
        ...rows,
    ].join("\n");
}
// ---- batch-3 tools: response time, JSON and redirect assertions (2026-09-27) ----
export async function assertResponseTime(args) {
    const url = normalizeTarget(args.url).toString();
    const samples = Math.min(Math.max(Math.floor(Number(args.samples ?? 3) || 3), 2), 5);
    const budget = Math.min(Math.max(Math.floor(Number(args.budget_ms ?? 1000) || 1000), 50), 30000);
    const times = [];
    const statuses = [];
    for (let i = 0; i < samples; i += 1) {
        const start = Date.now();
        const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "*/*" },
            signal: AbortSignal.timeout(Math.max(budget * 4, 5000)),
        });
        await res.arrayBuffer();
        times.push(Date.now() - start);
        statuses.push(res.status);
    }
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
    const worst = sorted[sorted.length - 1];
    const checks = [
        { name: "median under budget", passed: median <= budget, detail: `${median} ms vs budget ${budget} ms` },
        { name: "worst under 2x budget", passed: worst <= budget * 2, detail: `${worst} ms vs limit ${budget * 2} ms` },
        { name: "all samples answered < 400", passed: statuses.every((s) => s < 400), detail: `statuses ${statuses.join(", ")}` },
    ];
    return summarise(`Response-time assertion for ${url} (${samples} samples: ${times.map((t) => `${t}ms`).join(", ")})`, checks);
}
const valueAtPath = (body, path) => {
    let current = body;
    for (const part of path.split(".").map((p) => p.trim()).filter(Boolean)) {
        if (Array.isArray(current)) {
            const index = Number(part);
            if (!Number.isInteger(index) || index < 0 || index >= current.length)
                return { found: false, value: undefined };
            current = current[index];
            continue;
        }
        if (current !== null && typeof current === "object" && part in current) {
            current = current[part];
            continue;
        }
        return { found: false, value: undefined };
    }
    return { found: true, value: current };
};
export async function assertJson(args) {
    const r = await fetchChain(args.url, 20000);
    const contentType = r.headers.get("content-type") ?? "";
    const checks = [
        { name: "json content type", passed: /json/i.test(contentType), detail: contentType || "no content-type header" },
        { name: "status under 400", passed: r.status < 400, detail: `HTTP ${r.status}` },
    ];
    let parsed;
    let parseError = "";
    try {
        parsed = JSON.parse(r.html);
    }
    catch (e) {
        parseError = errorMessage(e);
    }
    const ok = parsed !== undefined;
    checks.push({ name: "parses as JSON", passed: ok, detail: ok ? `${r.html.length} bytes of JSON` : parseError });
    if (args.path) {
        const hit = valueAtPath(parsed, args.path);
        checks.push({
            name: `path ${args.path}`,
            passed: hit.found,
            detail: hit.found ? `= ${JSON.stringify(hit.value)?.slice(0, 200) ?? "undefined"}` : "not present in the response",
        });
        if (args.equals !== undefined) {
            const actual = typeof hit.value === "string" ? hit.value : JSON.stringify(hit.value);
            checks.push({
                name: "value equals",
                passed: hit.found && actual === args.equals,
                detail: `got ${String(actual).slice(0, 120) || "undefined"}, expected ${args.equals}`,
            });
        }
        if (args.contains !== undefined) {
            const hay = JSON.stringify(hit.value ?? "").toLowerCase();
            checks.push({
                name: "value contains",
                passed: hit.found && hay.includes(args.contains.toLowerCase()),
                detail: hay.slice(0, 160) || "no value resolved",
            });
        }
    }
    return summarise(`JSON API assertion for ${r.finalUrl} (HTTP ${r.status})`, checks);
}
export async function assertRedirect(args) {
    const r = await fetchChain(args.url, 15000);
    const first = r.hops[0];
    const redirectCodes = [301, 302, 303, 307, 308];
    const checks = [
        {
            name: "redirected",
            passed: r.hops.length > 1,
            detail: r.hops.length > 1 ? `${r.hops.length - 1} hop(s) to ${r.finalUrl}` : "answered directly with no redirect",
        },
        {
            name: "redirect status",
            passed: first ? redirectCodes.includes(first.status) : false,
            detail: first ? `HTTP ${first.status}` : "no response",
        },
    ];
    if (args.status) {
        const matcher = statusMatcher(args.status);
        checks.push({
            name: "status matches",
            passed: first ? matcher(first.status) : false,
            detail: first ? `HTTP ${first.status} vs expected ${args.status}` : "no response",
        });
    }
    if (args.location_contains) {
        const target = first?.location ?? "";
        checks.push({
            name: "location contains",
            passed: target.includes(args.location_contains),
            detail: target ? target.slice(0, 200) : "no Location header on the first hop",
        });
    }
    return summarise(`Redirect assertion for ${normalizeTarget(args.url).toString()}`, checks);
}
// ---- muxD tools:
const htmlTagCount = (html, tag) => (html.match(new RegExp(`<${tag}\\b`, "gi")) ?? []).length;
/** Matches every attribute occurrence, e.g. alt on <img>, and reports how many tags lack it. */
function tagsMissingAttr(html, tag, attr) {
    const tags = html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) ?? [];
    const missing = tags.filter((t) => !new RegExp(`\\b${attr}\\s*=`, "i").test(t));
    return { total: tags.length, missing: missing.length };
}
function metaContent(html, key, mode) {
    const re = new RegExp(`<meta[^>]*\\b${mode}\\s*=\\s*["']${key}["'][^>]*>`, "i");
    const tag = html.match(re)?.[0] ?? "";
    return tag.match(new RegExp("\\bcontent\\s*=\\s*[\"']([^\"']*)[\"']", "i"))?.[1]?.trim() ?? "";
}
function ldJsonBlocks(html) {
    const blocks = [...html.matchAll(new RegExp("<script[^>]*type\\s*=\\s*[\"']application\\/ld\\+json[\"'][^>]*>([\\s\\S]*?)<\\/script>", "gi"))]
        .map((m) => m[1].trim())
        .filter(Boolean);
    let valid = 0;
    for (const b of blocks) {
        try {
            JSON.parse(b);
            valid += 1;
        }
        catch {
            /* malformed block, counted as invalid */
        }
    }
    return { total: blocks.length, valid };
}
/** The machine-checkable slice of accessibility: language, heading order, alt text, zoom, landmarks. */
export async function a11yBasics(args) {
    const r = await fetchChain(args.url, 20000);
    const html = r.html;
    const maxImages = Math.min(Math.max(Number(args.max_images ?? 50) || 50, 1), 300);
    const checks = [];
    const lang = html.match(new RegExp("<html[^>]*\\blang\\s*=\\s*[\"']([^\"']*)[\"']", "i"))?.[1]?.trim() ?? "";
    checks.push({ name: "html lang", passed: Boolean(lang), detail: lang ? `lang="${lang}"` : "no lang attribute on <html>, so screen readers cannot pick a voice" });
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
    checks.push({ name: "title", passed: title.length > 0, detail: title ? `"${title.slice(0, 90)}" (${title.length} char(s))` : "no <title> in the document" });
    const h1s = htmlTagCount(html, "h1");
    checks.push({ name: "one h1", passed: h1s === 1, detail: h1s === 1 ? "exactly one <h1>, so the page has a single top-level heading" : `${h1s} <h1> element(s) — screen reader users lose the page outline` });
    const h = { h1: htmlTagCount(html, "h1"), h2: htmlTagCount(html, "h2"), h3: htmlTagCount(html, "h3"), h4: htmlTagCount(html, "h4") };
    const skipped = h.h2 === 0 && h.h1 > 0;
    checks.push({ name: "heading levels", passed: !skipped, detail: `h1 ${h.h1}, h2 ${h.h2}, h3 ${h.h3}, h4 ${h.h4}${skipped ? " — an <h1> with no <h2> below it often means the outline was flattened" : ""}` });
    const img = tagsMissingAttr(html, "img", "alt");
    const scoped = Math.min(img.total, maxImages);
    checks.push({
        name: "img alt",
        passed: img.missing === 0,
        detail: img.total ? `${scoped}/${scoped} of the first ${scoped} <img> carry an alt attribute (${img.missing} missing; ${img.total} images on the page)` : "no images on the page to describe",
    });
    const emptyAlt = (html.match(new RegExp("<img\\b[^>]*\\balt\\s*=\\s*[\"']\\s*[\"']", "gi")) ?? []).length;
    checks.push({
        name: "alt text not blank",
        passed: emptyAlt === 0,
        detail: emptyAlt ? `${emptyAlt} image(s) carry alt="" — correct only if they are decorative, otherwise they announce as an unlabelled graphic` : emptyAlt === 0 ? "no blank alt attributes" : "",
    });
    const viewport = metaContent(html, "viewport", "name");
    const zoomBlocked = /user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b/i.test(viewport);
    checks.push({ name: "viewport zoom", passed: Boolean(viewport) && !zoomBlocked, detail: viewport ? `"${viewport}"${zoomBlocked ? " — zoom is locked out, which WCAG 1.4.4 treats as a failure" : " and pinch-zoom is allowed"}` : "no viewport meta, so the page renders at desktop width on a phone" });
    const hasLandmark = /<main\b/i.test(html) || new RegExp("role\\s*=\\s*[\"']main[\"']", "i").test(html) || /<nav\b/i.test(html) || /<header\b/i.test(html);
    checks.push({ name: "landmarks", passed: hasLandmark, detail: hasLandmark ? `landmarks present: ${["main", "nav", "header", "footer", "aside"].filter((t) => new RegExp(`<${t}\\b`, "i").test(html)).join(", ") || "role-based"}` : "no main, nav, header or footer landmark in the markup" });
    const skipLink = new RegExp("class\\s*=\\s*[\"'][^\"']*skip[-_ ]?link", "i").test(html) || new RegExp("href\\s*=\\s*[\"']#(main|content|main-content)[\"']", "i").test(html);
    checks.push({ name: "skip link", passed: skipLink, detail: skipLink ? "a skip-to-content link is present, so keyboard users can bypass repeated navigation" : "no skip link found, so keyboard users tab through the whole nav on every page" });
    return summarise(`Accessibility basics for ${r.finalUrl} (HTTP ${r.status})`, checks);
}
/** Transport and browser-side security for one URL, read from the live response. */
export async function httpSecurityReport(args) {
    const method = methodOf(args?.method);
    const r = await fetchChain(args?.url, 25000, method);
    const header = (name) => r.headers.get(name) ?? "";
    const issues = [];
    const notes = [];
    const checks = [];
    // Plain HTTP at the very first hop is the one failure that undermines the rest.
    let plainHop = r.hops.some((h) => h.url.startsWith("http://"));
    if (plainHop)
        issues.push("the page was reached over plain HTTP at least once, so everything below can be rewritten in transit");
    const hsts = header("strict-transport-security");
    if (!hsts) {
        issues.push("no Strict-Transport-Security header, so a browser will try plain HTTP first next time");
    }
    else {
        const maxAge = Number(/max-age\s*=\s*(\d+)/i.exec(hsts)?.[1] ?? 0);
        const bits = [`max-age ${maxAge}s`];
        if (/includeSubDomains/i.test(hsts))
            bits.push("includeSubDomains");
        if (/preload/i.test(hsts))
            bits.push("preload");
        checks.push(`HSTS present: ${bits.join(", ")}`);
        if (maxAge > 0 && maxAge < 15552000)
            issues.push(`HSTS max-age is ${maxAge}s, under the six months browsers expect before they stop offering plain HTTP`);
        if (!/includeSubDomains/i.test(hsts))
            notes.push("HSTS does not cover subdomains, which is usually where staging and old services live");
    }
    const csp = header("content-security-policy");
    if (!csp) {
        issues.push("no Content-Security-Policy, so any injected script runs with the page's full privileges");
    }
    else {
        checks.push(`CSP present (${csp.length} characters)`);
        if (/unsafe-inline/i.test(csp))
            issues.push("CSP allows 'unsafe-inline', which gives back most of the protection a CSP is for");
        if (/unsafe-eval/i.test(csp))
            notes.push("CSP allows 'unsafe-eval'");
        if (/(^|[\s;])\*([\s;]|$)/.test(csp))
            notes.push("CSP uses a bare * source, which allows any origin");
        if (/http:/i.test(csp))
            notes.push("CSP still lists an http: source, which a secure page should not need");
    }
    if (!/nosniff/i.test(header("x-content-type-options")))
        issues.push("no X-Content-Type-Options: nosniff, so a browser may sniff a response into a different type than served");
    else
        checks.push("X-Content-Type-Options: nosniff");
    const referrer = header("referrer-policy");
    if (!referrer)
        issues.push("no Referrer-Policy, so full URLs leak to third parties by browser default");
    else
        checks.push(`Referrer-Policy: ${referrer}`);
    const permissions = header("permissions-policy") || header("feature-policy");
    if (!permissions)
        notes.push("no Permissions-Policy, so features such as camera and geolocation are governed only by the browser prompt");
    else
        checks.push(`Permissions-Policy present (${permissions.split(",").filter((s) => s.trim()).length} feature(s) named)`);
    const coop = header("cross-origin-opener-policy");
    if (!coop)
        notes.push("no Cross-Origin-Opener-Policy, so a cross-origin window can keep a reference to this one");
    else
        checks.push(`Cross-Origin-Opener-Policy: ${coop}`);
    const rawCookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
    const cookies = rawCookies.map((line) => {
        const name = String(line).split("=")[0].trim() || "(unnamed)";
        return { name, secure: /;\s*secure\b/i.test(line), httpOnly: /;\s*httponly\b/i.test(line), sameSite: /;\s*samesite\s*=\s*([^;]+)/i.exec(line)?.[1]?.trim() ?? "" };
    });
    for (const c of cookies) {
        if (!c.secure)
            issues.push(`cookie "${c.name}" is set without Secure, so it can travel over plain HTTP`);
        if (!c.httpOnly)
            notes.push(`cookie "${c.name}" is readable from JavaScript (no HttpOnly)`);
        if (!c.sameSite)
            notes.push(`cookie "${c.name}" declares no SameSite policy`);
    }
    const mixed = [...r.html.matchAll(/(?:src|href)\s*=\s*["'](http:\/\/[^"']+)["']/gi)].map((m) => m[1]);
    const uniqueMixed = [...new Set(mixed)].slice(0, 8);
    if (uniqueMixed.length)
        issues.push(`${uniqueMixed.length}+ plain-HTTP resource(s) referenced by the page itself, which browsers will block or warn about on an HTTPS page`);
    const rows = [
        `${r.finalUrl} — HTTP security report (${method}, HTTP ${r.status}, ${r.hops.length} hop(s))`,
        "",
        issues.length ? "Problems:" : "Problems: none found by these checks",
        ...issues.map((i) => `  - ${i}`),
        "",
        "What is present:",
        ...(checks.length ? checks.map((c) => `  - ${c}`) : ["  - nothing beyond the response itself"]),
        "",
        `Cookies set on this response: ${cookies.length ? cookies.map((c) => `${c.name}${c.secure ? " [Secure]" : " [NOT Secure]"}${c.httpOnly ? " [HttpOnly]" : " [no HttpOnly]"}${c.sameSite ? ` [SameSite=${c.sameSite}]` : " [no SameSite]"}`).join(", ") : "none"}`,
    ];
    if (uniqueMixed.length)
        rows.push(`Plain-HTTP resources: ${uniqueMixed.join(", ")}`);
    if (notes.length) {
        rows.push("", "Worth knowing:");
        for (const n of notes)
            rows.push(`  - ${n}`);
    }
    rows.push("", "note: read from one live response, so headers set only on some routes will not appear here, and a header being present says nothing about whether the policy behind it is correct. Cookie values are deliberately not shown, only their flags.");
    return rows.join("\n");
}
const titleOf = (html) => (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
const attrOf = (tagHtml, name) => new RegExp("\\b" + name + "\\s*=\\s*[\"']([^\"']*)[\"']", "i").exec(tagHtml)?.[1]?.trim() ?? "";
/** Search metadata as actually served, including the parts that quietly break. */
export async function seoMeta(args) {
    const r = await fetchChain(args?.url, 25000);
    const html = r.html;
    const min = Number.isFinite(Number(args?.min_title)) ? Number(args.min_title) : 10;
    const max = Number.isFinite(Number(args?.max_title)) ? Number(args.max_title) : 70;
    const title = titleOf(html);
    const description = metaContent(html, "description", "name");
    const robots = metaContent(html, "robots", "name");
    const canonicalTag = html.match(/<link[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i)?.[0] ?? "";
    const canonical = attrOf(canonicalTag, "href");
    const hreflangs = [...html.matchAll(/<link[^>]*\bhreflang\s*=\s*["']([^"']+)["'][^>]*>/gi)].map((m) => m[1].toLowerCase());
    const ld = ldJsonBlocks(html);
    const og = {
        title: metaContent(html, "og:title", "property"),
        description: metaContent(html, "og:description", "property"),
        image: metaContent(html, "og:image", "property"),
        type: metaContent(html, "og:type", "property"),
        url: metaContent(html, "og:url", "property"),
    };
    const tw = {
        card: metaContent(html, "twitter:card", "name"),
        title: metaContent(html, "twitter:title", "name"),
        image: metaContent(html, "twitter:image", "name"),
    };
    const issues = [];
    const titleLen = title.length;
    if (!titleLen)
        issues.push("no <title> at all, so a search result has nothing to show");
    else if (titleLen < min)
        issues.push(`title is ${titleLen} characters, under the ${min} minimum: too thin to say what the page is`);
    else if (titleLen > max)
        issues.push(`title is ${titleLen} characters, over the ${max} maximum: search results will cut it`);
    if (!description)
        issues.push("no meta description, so the engine writes its own snippet");
    else if (description.length < 50)
        issues.push(`meta description is only ${description.length} characters`);
    else if (description.length > 320)
        issues.push(`meta description is ${description.length} characters, well past what is shown`);
    if (!canonical)
        issues.push("no rel=canonical, so a paginated or parameterised copy can compete with this page");
    if (/noindex/i.test(robots))
        issues.push(`robots is "${robots}": this page is telling engines not to index it`);
    if (!og.title || !og.description || !og.image)
        issues.push(`Open Graph is incomplete (${["title", "description", "image"].filter((k) => !og[k]).join(", ")} missing)`);
    if (!tw.card)
        issues.push("no twitter:card, so sharing this on X produces a bare link");
    if (ld.total && ld.valid < ld.total)
        issues.push(`${ld.total - ld.valid} of ${ld.total} JSON-LD block(s) do not parse, so the structured data is silently ignored`);
    if (hreflangs.length && !hreflangs.includes("x-default"))
        issues.push("hreflang alternates exist but none is x-default, so there is no fallback for unmatched languages");
    const rows = [
        `${r.finalUrl} — SEO metadata as served (HTTP ${r.status})`,
        "",
        `  title            ${title ? `${titleLen} chars — ${title}` : "MISSING"}`,
        `  description      ${description ? `${description.length} chars — ${description.slice(0, 160)}` : "MISSING"}`,
        `  canonical        ${canonical || "MISSING"}`,
        `  robots           ${robots || "not set (indexable by default)"}`,
        `  Open Graph       ${["title", "description", "image", "type", "url"].map((k) => `${k}: ${og[k] ? "yes" : "no"}`).join(" | ")}`,
        `  Twitter card     ${tw.card ? `${tw.card}${tw.title ? ", title" : ""}${tw.image ? ", image" : ""}` : "MISSING"}`,
        `  hreflang         ${hreflangs.length ? `${hreflangs.length} alternate(s): ${hreflangs.slice(0, 8).join(", ")}${hreflangs.length > 8 ? " …" : ""}` : "none"}`,
        `  JSON-LD          ${ld.total ? `${ld.valid}/${ld.total} block(s) parse` : "no structured data"}`,
        "",
        issues.length ? "Problems:" : "Problems: none found by these checks",
        ...issues.map((i) => `  - ${i}`),
        "",
        `note: this reads the HTML the server returns to a plain client with no special user agent. A page that renders its metadata in JavaScript will look empty here even if a browser shows it, and title length limits are conventions that each search engine applies differently.`,
    ];
    return rows.join("\n");
}
