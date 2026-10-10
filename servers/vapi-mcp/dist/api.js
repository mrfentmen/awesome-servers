export class VapiError extends Error {
    constructor(message) {
        super(message);
        this.name = "VapiError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.vapi.ai";
function headers() {
    const k = process.env.VAPI_API_KEY;
    if (!k)
        throw new VapiError("Set VAPI_API_KEY (free Vapi tier).");
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new VapiError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new VapiError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function listAssistants(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/assistant?limit=${n}`);
}
export function getAssistant(assistantId) {
    return get(`/assistant/${encodeURIComponent(assistantId)}`);
}
export function listCalls(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/call?limit=${n}`);
}
export function getCall(callId) {
    return get(`/call/${encodeURIComponent(callId)}`);
}
// ---- muxH tools:
// The four tools above call Vapi's API with an account token and report the
// caller's own assistants and calls. A voice agent, though, fails at whichever
// layer it depends on, and almost none of those layers are Vapi. These two read
// the public status pages of the telephony, transport, speech and model providers
// a Vapi agent actually calls, so a broken agent can be attributed to a layer.
const VA_UA = "mcfentmen-vapi-mcp/1.2 (https://github.com/mcfentmen/vapi-mcp)";
const VA_PROVIDERS = [
    { layer: "telephony", role: "carries the call and the number", host: "status.twilio.com" },
    { layer: "transport", role: "carries the audio between client and server", host: "status.daily.co" },
    { layer: "speech to text", role: "turns the caller's speech into text", host: "status.deepgram.com" },
    { layer: "text to speech", role: "speaks the agent's reply", host: "status.cartesia.ai" },
    { layer: "text to speech", role: "alternative voice synthesis", host: "status.elevenlabs.io" },
    { layer: "transcription", role: "alternative speech to text", host: "status.assemblyai.com" },
    { layer: "language model", role: "decides what the agent says next", host: "status.openai.com" },
];
const vaVerdict = (indicator) => {
    const key = String(indicator ?? "").toLowerCase();
    if (key === "none")
        return "operating normally";
    if (key.includes("minor"))
        return "minor degradation";
    if (key.includes("major"))
        return "major outage";
    if (key.includes("critical"))
        return "critical outage";
    if (key.includes("maintenance"))
        return "under maintenance";
    return indicator ? indicator.replace(/_/g, " ") : "state not reported";
};
const vaWorse = (a, b) => {
    const rank = (s) => {
        const key = s.toLowerCase();
        if (key === "none")
            return 0;
        if (key.includes("minor"))
            return 1;
        if (key.includes("major"))
            return 2;
        if (key.includes("critical"))
            return 3;
        return 1;
    };
    return rank(b) - rank(a);
};
const vaClean = (raw) => String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
async function vaSummary(host) {
    try {
        const res = await fetch(`https://${host}/api/v2/summary.json`, {
            headers: { "User-Agent": VA_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            return null;
        const body = (await res.json());
        return body?.status ? body : null;
    }
    catch {
        // One provider being unreachable must not lose the rest of the stack.
        return null;
    }
}
/**
 * The health of every layer a Vapi voice agent sits on, read from each provider's
 * own public status page: telephony, transport, speech to text, text to speech and
 * the language model. This is the difference between an agent that is broken and a
 * layer underneath it that is, which is the first question when a call fails.
 */
export async function voiceStackStatus(_args) {
    const wanted = String(_args?.layer ?? "").trim().toLowerCase();
    const providers = wanted ? VA_PROVIDERS.filter((p) => p.layer === wanted || p.role.includes(wanted) || p.host.includes(wanted)) : VA_PROVIDERS;
    if (!providers.length) {
        throw new Error(`No provider matches "${_args?.layer}". Layers here: ${[...new Set(VA_PROVIDERS.map((p) => p.layer))].join(", ")}.`);
    }
    const results = await Promise.all(providers.map(async (p) => ({ provider: p, summary: await vaSummary(p.host) })));
    const reachable = results.filter((r) => r.summary !== null);
    if (!reachable.length) {
        throw new Error("None of the providers' status pages answered. Each is fetched independently, so this means the network reaching them is the problem rather than any one provider.");
    }
    const rows = reachable
        .map(({ provider, summary }) => {
        const doc = summary;
        const indicator = doc.status?.indicator ?? "not reported";
        const open = (doc.incidents ?? []).filter((i) => i.status !== "completed" && i.status !== "resolved");
        const down = (doc.components ?? []).filter((c) => c.status && c.status !== "operational");
        return {
            provider,
            indicator,
            verdict: vaVerdict(indicator),
            components: doc.components?.length ?? 0,
            down,
            open,
            maintenance: doc.scheduled_maintenances ?? [],
            updated: doc.page?.updated_at ?? "not reported",
        };
    })
        .sort((a, b) => vaWorse(a.indicator, b.indicator) || a.provider.layer.localeCompare(b.provider.layer));
    const worst = rows[0];
    const degraded = rows.filter((r) => r.verdict !== "operating normally");
    const missing = results.filter((r) => r.summary === null).map((r) => r.provider.host);
    const lines = [
        "Voice stack health, from each provider's own status page",
        `  ${reachable.length} of ${providers.length} provider(s) answered`,
        `  worst layer right now: ${worst.provider.layer} (${worst.provider.host}) — ${worst.verdict}`,
        `  ${degraded.length ? `${degraded.length} layer(s) not fully normal: ${degraded.map((r) => `${r.provider.layer} [${r.provider.host}]`).join(", ")}` : "every layer that answered reports normal operation"}`,
        "",
        "By layer:",
        ...rows.map((r) => {
            const bits = [
                `  ${r.provider.layer.padEnd(16)}${r.provider.host.padEnd(24)}${r.verdict.padEnd(24)}`,
                `${r.components} component(s)`,
                r.down.length ? `${r.down.length} not operational` : "",
                r.open.length ? `${r.open.length} open incident(s)` : "",
            ].filter(Boolean);
            return `${bits.join("  ")}  (updated ${String(r.updated).slice(0, 16).replace("T", " ")})\n      role: ${r.provider.role}`;
        }),
        ...(missing.length ? ["", `Unreachable status pages: ${missing.join(", ")}. Their state is unknown, not good.`] : []),
    ];
    const withOpen = rows.filter((r) => r.open.length > 0);
    if (withOpen.length) {
        lines.push("", "Open incidents:");
        for (const row of withOpen) {
            for (const incident of row.open.slice(0, 2)) {
                const touched = (incident.components ?? []).map((c) => c.name).filter(Boolean).join(", ");
                lines.push(`  - ${row.provider.layer}: ${incident.name ?? "untitled"} (${incident.status ?? "?"}, impact ${incident.impact ?? "not reported"}) since ${String(incident.created_at ?? "?").slice(0, 16).replace("T", " ")}` +
                    `${touched ? ` | ${touched}` : ""}`);
                if (incident.shortlink)
                    lines.push(`    ${incident.shortlink}`);
            }
        }
    }
    lines.push("", "This reads each provider's public status page independently, so it is a snapshot of what those pages say, not a measurement of a call. A layer reporting normal here can still be failing for one account, one region or one number, and a provider is only as honest as its own reporting threshold. Vapi itself is not in this list because it does not publish a machine-readable status page.");
    return lines.join("\n");
}
/**
 * The forward-looking half of the same question: what the stack has scheduled.
 * Planned maintenance is the one cause of a voice agent failing at a known time,
 * and every provider publishes it a few days ahead.
 */
export async function stackMaintenance(_args) {
    const days = Math.min(Math.max(Number(_args?.window ?? 45) || 45, 1), 180);
    const results = await Promise.all(VA_PROVIDERS.map(async (p) => ({ provider: p, summary: await vaSummary(p.host) })));
    const reachable = results.filter((r) => r.summary !== null);
    if (!reachable.length)
        throw new Error("None of the providers' status pages answered.");
    const now = Date.now();
    const windows = [];
    for (const { provider, summary } of reachable) {
        const doc = summary;
        for (const item of [...(doc.scheduled_maintenances ?? []), ...(doc.incidents ?? [])]) {
            const impact = String(item.impact ?? "").toLowerCase();
            const scheduled = item.scheduled_for ? Date.parse(item.scheduled_for) : null;
            const resolved = item.resolved_at ? Date.parse(item.resolved_at) : null;
            const isMaintenance = impact === "maintenance" || !!scheduled;
            if (!isMaintenance)
                continue;
            const anchor = scheduled ?? (item.created_at ? Date.parse(item.created_at) : null);
            if (anchor === null || !Number.isFinite(anchor))
                continue;
            if (Math.abs(anchor - now) > days * 86400000)
                continue;
            windows.push({
                layer: provider.layer,
                host: provider.host,
                name: item.name ?? "untitled",
                status: item.status ?? "not reported",
                impact: item.impact ?? "not reported",
                start: item.scheduled_for ?? item.created_at ?? "not reported",
                end: item.scheduled_until ?? item.resolved_at ?? "not open-ended",
                link: item.shortlink ?? "",
                when: anchor >= now ? "upcoming" : "recent",
            });
        }
    }
    const upcoming = windows.filter((w) => w.when === "upcoming").sort((a, b) => (a.start < b.start ? -1 : 1));
    const recent = windows.filter((w) => w.when === "recent").sort((a, b) => (a.start < b.start ? 1 : -1));
    const layers = new Set(windows.map((w) => w.layer));
    return [
        `Scheduled and recent maintenance across the voice stack, within ${days} days`,
        `  ${reachable.length} provider status page(s) read, ${windows.length} maintenance or incident window(s) in range`,
        upcoming.length
            ? `  ${upcoming.length} upcoming, the next on ${String(upcoming[0].start).slice(0, 16).replace("T", " ")} in the ${upcoming[0].layer} layer`
            : "  nothing upcoming in this window",
        layers.size ? `  layers affected: ${[...layers].join(", ")}` : "  no layer has published anything in this window",
        "",
        "Upcoming:",
        ...(upcoming.length
            ? upcoming.slice(0, 12).map((w) => `  ${String(w.start).slice(0, 16).replace("T", " ")}  ${w.layer.padEnd(16)}${w.host.padEnd(24)}${w.impact.padEnd(14)}${w.name.slice(0, 46)}` +
                `\n      until ${String(w.end).slice(0, 16).replace("T", " ")}${w.link ? `  ${w.link}` : ""}`)
            : ["  none published"]),
        "",
        "Recently finished:",
        ...(recent.length
            ? recent.slice(0, 8).map((w) => `  ${String(w.start).slice(0, 10)}  ${w.layer.padEnd(16)}${w.host.padEnd(24)}${String(w.impact).padEnd(14)}${w.name.slice(0, 50)}`)
            : ["  none published"]),
        "",
        "Read as: a maintenance window is a declared intention, and a provider routinely finishes early or late, so treat the window as a period to avoid rather than a duration to plan around. Incidents are mixed in here because a provider sometimes files an open fault as a maintenance-style window, which is why the two lists are not identical in kind. Nothing here describes Vapi's own behaviour between the layers.",
    ].join("\n");
}
