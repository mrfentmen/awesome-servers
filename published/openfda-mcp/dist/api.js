const m0 = (() => {
    const BASE = "https://api.fda.gov";
    class FdaError extends Error {
    }
    async function request(path) {
        const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(25000) });
        if (!res.ok)
            throw new FdaError(`openFDA error ${res.status}`);
        return (await res.json());
    }
    async function drugRecalls(args) {
        const search = args.search ? `&search=${encodeURIComponent(args.search)}` : "";
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await request(`/drug/enforcement.json?limit=${limit}${search}`);
        const rows = d.results ?? [];
        return rows.map((r) => `${r.status ?? ""} | ${r.recall_number ?? ""}\n  ${r.product_description ?? ""}\n  Reason: ${r.reason_for_recall ?? ""}\n  ${r.classification ?? ""}`).join("\n\n") || "No recalls found";
    }
    async function adverseEvents(args) {
        const drug = encodeURIComponent(args.drug ?? "");
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await request(`/drug/event.json?search=patient.drug.medicinalproduct:"${drug}"&limit=${limit}`);
        const rows = d.results ?? [];
        return rows.map((r, i) => {
            const rx = r.patient?.drug?.[0];
            return `${i + 1}. ${rx?.medicinalproduct ?? "unknown drug"} | ${r.seriousnessdeath ? "DEATH" : r.seriousnesshospitalization ? "HOSPITAL" : "report"}\n   Reactions: ${(r.patient?.reaction ?? []).map((x) => x.reactionmeddrapt).join(", ") || "none listed"}`;
        }).join("\n\n") || "No adverse events found";
    }
    async function approvedDrugs(args) {
        const q = encodeURIComponent(args.query ?? "");
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await request(`/drug/drugsfda.json?search=openfda.brand_name:"${q}"+OR+openfda.generic_name:"${q}"&limit=${limit}`);
        const rows = d.results ?? [];
        return rows.map((r) => {
            const o = r.openfda ?? {};
            return `${o.brand_name?.[0] ?? "unknown brand"} | ${o.generic_name?.[0] ?? ""}\n  Application ${r.application_number ?? ""} | ${o.route?.[0] ?? ""} | ${o.manufacturer_name?.[0] ?? ""}`;
        }).join("\n\n") || "No approved drugs found";
    }
    return { FdaError, adverseEvents, approvedDrugs, drugRecalls };
})();
const m1 = (() => {
    const BASE = 'https://api.fda.gov/drug/event.json';
    async function events(args) {
        const drug = (args.drug ?? '').trim();
        if (!drug)
            return 'Provide a drug brand name.';
        const limit = Math.max(1, Math.min(args.limit ?? 5, 20));
        const query = `patient.drug.openfda.brand_name:"${drug}"`;
        const url = `${BASE}?search=${encodeURIComponent(query)}&limit=${limit}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'mrfentmen-daily-med-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`openFDA returned ${res.status}`);
        const data = (await res.json());
        const rows = data.results ?? [];
        if (!rows.length)
            return `No FDA event reports found for "${drug}".`;
        return `FDA adverse event reports for "${drug}" (${data.meta?.results?.total ?? rows.length} total, ${rows.length} shown):\n` +
            rows
                .map((r, i) => {
                const serious = r.serious ? 'SERIOUS' : 'not serious';
                const reportDate = r.report_date ? String(r.report_date) : '';
                return `${i + 1}. ${reportDate || 'no date'} | ${serious}${r.reaction ? ` | ${JSON.stringify(r.reaction).slice(0, 100)}` : ''}`;
            })
                .join('\n');
    }
    return { events };
})();
export const FdaError = m0.FdaError;
export const adverseEvents = m0.adverseEvents;
export const approvedDrugs = m0.approvedDrugs;
export const drugRecalls = m0.drugRecalls;
export const events = m1.events;
export const m0_adverseEvents = m0.adverseEvents;
export const m0_FdaError = m0.FdaError;
export const m0_approvedDrugs = m0.approvedDrugs;
export const m0_drugRecalls = m0.drugRecalls;
export const m1_events = m1.events;
const m2 = (() => {
    const BASE2 = "https://api.fda.gov";
    class Fda2Error extends Error {
    }
    async function get2(path) {
        const res = await fetch(`${BASE2}${path}`, {
            headers: { "User-Agent": "mrfentmen-openfda-mcp/1.0", Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Fda2Error(`openFDA error ${res.status}`);
        return res.json();
    }
    async function deviceRecalls(args) {
        const search = args.search ? `&search=${encodeURIComponent(args.search)}` : "";
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await get2(`/device/enforcement.json?limit=${limit}${search}`);
        const rows = d.results ?? [];
        return rows.map((r) => `${r.status ?? ""} | ${r.recall_number ?? ""}\n  ${r.product_description ?? ""}\n  Reason: ${r.reason_for_recall ?? ""}`).join("\n\n") || "No device recalls found";
    }
    async function deviceEvents(args) {
        const device = encodeURIComponent(args.device ?? "");
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await get2(`/device/event.json?search=device.generic_name:"${device}"&limit=${limit}`);
        const rows = d.results ?? [];
        return rows.map((r, i) => `${i + 1}. ${r.event_type ?? "report"} | ${r.date_received ?? ""}\n   ${(r.event_description ?? "").slice(0, 200)}`).join("\n\n") || "No device events found";
    }
    async function foodRecalls(args) {
        const search = args.search ? `&search=${encodeURIComponent(args.search)}` : "";
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await get2(`/food/enforcement.json?limit=${limit}${search}`);
        const rows = d.results ?? [];
        return rows.map((r) => `${r.status ?? ""} | ${r.recall_number ?? ""}\n  ${r.product_description ?? ""}\n  Reason: ${r.reason_for_recall ?? ""}`).join("\n\n") || "No food recalls found";
    }
    async function labelSearch(args) {
        const q = encodeURIComponent(args.query ?? "");
        const limit = Math.min(args.limit ?? 10, 50);
        const d = await get2(`/drug/label.json?search=openfda.brand_name:"${q}"+OR+openfda.generic_name:"${q}"&limit=${limit}`);
        const rows = d.results ?? [];
        return rows.map((r) => {
            const o = r.openfda ?? {};
            return `${o.brand_name?.[0] ?? "unknown"} | ${o.generic_name?.[0] ?? ""}\n  Purpose: ${(r.purpose?.[0] ?? "").slice(0, 160)}`;
        }).join("\n\n") || "No labels found";
    }
    async function topReactions(args) {
        const drug = encodeURIComponent(args.drug ?? "");
        const d = await get2(`/drug/event.json?search=patient.drug.medicinalproduct:"${drug}"&count=patient.reaction.reactionmeddrapt.exact&limit=10`);
        const rows = d.results ?? [];
        if (!rows.length)
            return `No reaction counts for "${args.drug ?? ""}".`;
        return rows.map((r, i) => `${i + 1}. ${r.term ?? "?"} (${r.count ?? 0})`).join("\n");
    }
    async function ndcLookup(args) {
        const code = encodeURIComponent((args.code ?? "").trim());
        if (!code)
            throw new Fda2Error("Provide an NDC code");
        const d = await get2(`/ndc.json?search=product_ndc:"${code}"&limit=5`);
        const rows = d.results ?? [];
        if (!rows.length)
            return `No NDC record for ${args.code}.`;
        const r = rows[0];
        return `${r.brand_name ?? "?"} | ${r.generic_name ?? ""}\n  NDC: ${r.product_ndc ?? ""} | Manufacturer: ${r.manufacturer_name ?? ""} | Type: ${r.product_type ?? ""}`;
    }
    return { Fda2Error, deviceRecalls, deviceEvents, foodRecalls, labelSearch, topReactions, ndcLookup };
})();
export const Fda2Error = m2.Fda2Error;
export const deviceRecalls = m2.deviceRecalls;
export const deviceEvents = m2.deviceEvents;
export const foodRecalls = m2.foodRecalls;
export const labelSearch = m2.labelSearch;
export const topReactions = m2.topReactions;
export const ndcLookup = m2.ndcLookup;
export const m2_Fda2Error = m2.Fda2Error;
export const m2_deviceRecalls = m2.deviceRecalls;
export const m2_deviceEvents = m2.deviceEvents;
export const m2_foodRecalls = m2.foodRecalls;
export const m2_labelSearch = m2.labelSearch;
export const m2_topReactions = m2.topReactions;
export const m2_ndcLookup = m2.ndcLookup;
