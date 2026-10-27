const m0 = (() => {
    const RDAP = "https://rdap.org";
    const UA = "mrfentmen-whois-mcp/1.0 (https://github.com/mrfentmen)";
    class WhoisError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
        if (!res.ok)
            throw new WhoisError(`RDAP returned HTTP ${res.status}`);
        return (await res.json());
    }
    function dates(d) {
        const out = {};
        const ev = (d?.events ?? []);
        const find = (t) => {
            const e = ev.find((x) => x?.eventAction === t);
            return e?.eventDate ? e.eventDate.slice(0, 10) : undefined;
        };
        out.created = find("registration");
        out.updated = find("last changed");
        out.expires = find("expiration");
        return out;
    }
    async function domain(args) {
        const dname = (args.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
        if (!dname || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dname))
            throw new WhoisError("Provide a valid domain like example.com");
        const d = await get(`${RDAP}/domain/${encodeURIComponent(dname)}`);
        const t = dates(d);
        const ns = (d?.nameservers ?? []).map((n) => n?.ldhName ?? "").filter(Boolean);
        const status = (d?.status ?? []).slice(0, 6);
        const lines = [
            `Domain: ${d?.ldhName ?? dname}`,
            `Registrar: ${d?.entities?.find((e) => (e?.roles ?? []).includes("registrar"))?.vcardArray?.[1]?.find((v) => v[0] === "fn")?.[3] ?? "n/a"}`,
            `Created: ${t.created ?? "n/a"}`,
            `Updated: ${t.updated ?? "n/a"}`,
            `Expires: ${t.expires ?? "n/a"}`,
        ];
        if (ns.length)
            lines.push(`Nameservers: ${ns.join(", ")}`);
        if (status.length)
            lines.push(`Status: ${status.join(", ")}`);
        return lines.join("\n");
    }
    async function ip(args) {
        const addr = (args.ip ?? "").trim();
        if (!addr)
            throw new WhoisError("Provide an IP address");
        const d = await get(`${RDAP}/ip/${encodeURIComponent(addr)}`);
        const range = d?.startAddress && d?.endAddress ? `${d.startAddress} - ${d.endAddress}` : addr;
        const lines = [
            `IP: ${addr}`,
            `Range: ${range}`,
            `Name: ${d?.name ?? "n/a"}`,
            `Country: ${d?.country ?? "n/a"}`,
            `Handle: ${d?.handle ?? "n/a"}`,
        ];
        const org = d?.entities?.find((e) => (e?.roles ?? []).includes("registrant") || (e?.roles ?? []).includes("holder"));
        if (org) {
            const fn = org?.vcardArray?.[1]?.find((v) => v[0] === "fn")?.[3];
            if (fn)
                lines.push(`Organization: ${fn}`);
        }
        return lines.join("\n");
    }
    return { WhoisError, domain, ip };
})();
const m1 = (() => {
    const BASE = "https://rdap.org";
    const UA = "mrfentmen-domain-info-mcp/1.0 (https://github.com/mrfentmen)";
    class DomainError extends Error {
    }
    async function domainInfo(args) {
        const domain = (args.domain ?? "").trim().toLowerCase();
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain))
            throw new DomainError("Provide a valid domain like example.com");
        const res = await fetch(`${BASE}/domain/${encodeURIComponent(domain)}`, {
            headers: { "User-Agent": UA, Accept: "application/rdap+json" },
            redirect: "follow",
            signal: AbortSignal.timeout(25000),
        });
        if (res.status === 404)
            throw new DomainError(`No RDAP data for ${domain}`);
        if (!res.ok)
            throw new DomainError(`RDAP error ${res.status}`);
        const d = await res.json();
        const ns = (d.nameservers ?? []).map((n) => n.ldhName ?? n.fqdn ?? "").join(", ");
        const status = (d.status ?? []).join(", ");
        const events = {};
        for (const e of d.events ?? []) {
            if (e.eventAction && e.eventDate)
                events[e.eventAction] = String(e.eventDate).slice(0, 10);
        }
        const registrant = d.entities?.find((x) => x.roles?.includes("registrant"))?.vcardArray?.[1];
        const name = registrant?.find((r) => r[0] === "fn")?.[3] ?? "n/a";
        const handle = d.handle ?? "";
        return [
            `Domain: ${d.ldhName ?? domain}`,
            handle ? `Handle: ${handle}` : "",
            events.registration ? `Registered: ${events.registration}` : "",
            events.expiration ? `Expires: ${events.expiration}` : "",
            events.last_changed ? `Last changed: ${events.last_changed}` : "",
            status ? `Status: ${status}` : "",
            ns ? `Nameservers: ${ns}` : "",
            `Registrant: ${name}`,
        ].filter(Boolean).join("\n");
    }
    return { DomainError, domainInfo };
})();
export const DomainError = m1.DomainError;
export const WhoisError = m0.WhoisError;
export const domain = m0.domain;
export const domainInfo = m1.domainInfo;
export const ip = m0.ip;
export const m0_domain = m0.domain;
export const m0_ip = m0.ip;
export const m0_WhoisError = m0.WhoisError;
export const m1_domainInfo = m1.domainInfo;
export const m1_DomainError = m1.DomainError;
// ---- muxC tools:
const RDAP_UA = "mrfentmen-whois-mcp/1.0 (https://github.com/mrfentmen)";
class RdapError extends Error {
}
async function rdap(path, ms = 30000) {
    const res = await fetch(`https://rdap.org/${path}`, {
        headers: { "User-Agent": RDAP_UA, Accept: "application/rdap+json, application/json" },
        redirect: "follow",
        signal: AbortSignal.timeout(ms),
    });
    if (res.status === 404)
        throw new RdapError("RDAP has no record for that identifier");
    if (!res.ok)
        throw new RdapError(`RDAP returned ${res.status} for ${path}`);
    return await res.json();
}
function events(d) {
    const rows = d?.events ?? [];
    return rows
        .filter((e) => ["registration", "expiration", "last changed", "last update of RDAP database"].includes(e.eventAction))
        .map((e) => `${e.eventAction}: ${String(e.eventDate ?? "").slice(0, 10)}`);
}
