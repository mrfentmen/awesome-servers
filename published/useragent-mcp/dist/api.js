/**
 * User Agent Parser — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "User Agent Parser";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "useragent-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
const BOTS = [
    [/googlebot/i, "Googlebot"], [/bingbot/i, "Bingbot"], [/yandex(bot)?/i, "YandexBot"],
    [/duckduckbot/i, "DuckDuckBot"], [/baiduspider/i, "Baiduspider"], [/applebot/i, "Applebot"],
    [/facebookexternalhit/i, "Facebook preview"], [/twitterbot/i, "Twitter/X preview"],
    [/linkedinbot/i, "LinkedIn preview"], [/slackbot/i, "Slack preview"], [/discordbot/i, "Discord preview"],
    [/telegrambot/i, "Telegram preview"], [/whatsapp/i, "WhatsApp preview"],
    [/curl\//i, "curl"], [/wget\//i, "wget"], [/python-requests/i, "python-requests"],
    [/python-urllib/i, "python-urllib"], [/go-http-client/i, "Go HTTP client"], [/okhttp/i, "OkHttp"],
    [/postmanruntime/i, "Postman"], [/insomnia/i, "Insomnia"], [/node-fetch/i, "node-fetch"],
    [/axios/i, "axios"], [/headlesschrome/i, "Headless Chrome"], [/phantomjs/i, "PhantomJS"],
    [/ahrefsbot/i, "AhrefsBot"], [/semrushbot/i, "SemrushBot"], [/mj12bot/i, "MJ12bot"],
    [/gptbot/i, "GPTBot"], [/claudebot/i, "ClaudeBot"], [/ccbot/i, "CCBot"], [/perplexitybot/i, "PerplexityBot"],
];
function detect(ua) {
    for (const [re, name] of BOTS)
        if (re.test(ua))
            return name;
    return null;
}
function parse(ua) {
    const bot = detect(ua);
    let browser = "Unknown";
    let version = "";
    const pick = (re, name) => {
        const m = ua.match(re);
        if (!m)
            return false;
        browser = name;
        version = m[1] ?? "";
        return true;
    };
    if (!pick(/Edg(?:A|iOS)?\/([\d.]+)/, "Edge")
        && !pick(/OPR\/([\d.]+)/, "Opera")
        && !pick(/SamsungBrowser\/([\d.]+)/, "Samsung Internet")
        && !pick(/Firefox\/([\d.]+)/, "Firefox")
        && !pick(/CriOS\/([\d.]+)/, "Chrome iOS")
        && !pick(/Chrome\/([\d.]+)/, "Chrome")
        && !pick(/Version\/([\d.]+).*Safari/, "Safari")
        && !pick(/Safari\/([\d.]+)/, "Safari")
        && !pick(/curl\/([\d.]+)/, "curl")
        && !pick(/python-requests\/([\d.]+)/i, "python-requests")
        && !pick(/Go-http-client\/([\d.]+)/i, "Go HTTP client")) {
        browser = bot ?? "Unknown";
    }
    const engine = /AppleWebKit/.test(ua)
        ? /Chrome|Edg|OPR/.test(ua) ? "Blink" : "WebKit"
        : /Gecko\/|Firefox/.test(ua) ? "Gecko"
            : /Trident/.test(ua) ? "Trident" : "Unknown";
    const os = /Windows NT 10/.test(ua) ? "Windows 10/11"
        : /Windows NT 6\.3/.test(ua) ? "Windows 8.1"
            : /Windows NT 6\.1/.test(ua) ? "Windows 7"
                : /Android ([\d.]+)/.test(ua) ? `Android ${ua.match(/Android ([\d.]+)/)[1]}`
                    : /iPhone|iPad|iPod/.test(ua) ? `iOS ${(ua.match(/OS (\d+[_.]\d+)/) ?? [])[1]?.replace(/_/g, ".") ?? ""}`.trim()
                        : /Mac OS X/.test(ua) ? `macOS ${(ua.match(/Mac OS X (\d+[_.]\d+)/) ?? [])[1]?.replace(/_/g, ".") ?? ""}`.trim()
                            : /CrOS/.test(ua) ? "ChromeOS"
                                : /Ubuntu/.test(ua) ? "Ubuntu"
                                    : /Linux/.test(ua) ? "Linux"
                                        : "Unknown";
    const device = /iPad|Tablet/.test(ua) ? "tablet"
        : /Mobile|iPhone|Android.*Mobile/.test(ua) ? "mobile"
            : bot ? "bot"
                : /TV|SmartTV|AppleTV/.test(ua) ? "tv"
                    : "desktop";
    return { browser, version, engine, os, device, bot };
}
export async function parseUserAgent(a) {
    const p = parse(a.userAgent);
    return [
        `Browser: ${p.browser}${p.version ? ` ${p.version}` : ""}`,
        `Engine: ${p.engine}`,
        `OS: ${p.os}`,
        `Device: ${p.device}`,
        `Bot: ${p.bot ?? "no"}`,
    ].join("\n");
}
export async function detectBot(a) {
    const bot = detect(a.userAgent);
    return bot
        ? `Detected: ${bot}\nThis user-agent identifies an automated client, not a person.`
        : "No known bot or automation client matched; this looks like a normal browser or an unlisted client.";
}
export async function parseUserAgentBatch(a) {
    const rows = a.userAgents.map((ua, i) => {
        const p = parse(ua);
        return `${i + 1}. ${p.browser}${p.version ? ` ${p.version}` : ""} on ${p.os} (${p.device})${p.bot ? ` [bot: ${p.bot}]` : ""}`;
    });
    return rows.join("\n");
}
