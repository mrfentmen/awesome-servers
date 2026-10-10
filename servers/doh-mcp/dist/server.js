import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { caaRecords, emailRecords, errorMessage, normaliseProvider, resolve, resolveMany, reverseLookup, formatAnswer, providersHelp, recordSummary, dnssecCheck, propagationCheck, txtContains, wildcardCheck } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NAME = z.string().describe("Hostname, e.g. example.com");
const TYPE = z.string().describe("Record type such as A, AAAA, MX, TXT, NS, CAA (default A)").optional();
const PROVIDER = z
    .enum(["cloudflare", "google", "adguard"])
    .describe("Which public resolver to ask (default cloudflare)")
    .optional();
export function createServer() {
    const server = new McpServer({
        name: "doh-mcp",
        version: "1.0.0",
    });
    server.registerTool("resolve", {
        title: "Resolve DNS record",
        description: "Look up DNS records for a hostname over HTTPS (no local resolver needed). " +
            "Returns the record values with their TTL.",
        inputSchema: z.object({ name: NAME, type: TYPE, provider: PROVIDER }),
        annotations: READ_ONLY,
    }, async ({ name, type, provider }) => {
        try {
            const p = normaliseProvider(provider);
            const res = await resolve(name, type ?? "A", p);
            return text(formatAnswer(name.replace(/\.$/, ""), (type ?? "A").toUpperCase(), p, res));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("resolve_many", {
        title: "Resolve many names",
        description: "Resolve one record type for up to 15 hostnames in a single call. " +
            "Handy for checking a list of domains at once.",
        inputSchema: z.object({
            names: z.string().describe("Comma-separated hostnames, e.g. 'a.com, b.com, c.com'"),
            type: TYPE,
            provider: PROVIDER,
        }),
        annotations: READ_ONLY,
    }, async ({ names, type, provider }) => {
        try {
            return text(await resolveMany(names.split(","), type ?? "A", normaliseProvider(provider)));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("record_summary", {
        title: "DNS record summary",
        description: "Every common record for a domain in one call: A, AAAA, CNAME, MX, TXT, NS, SOA and CAA. " +
            "Good first call when auditing a domain.",
        inputSchema: z.object({ domain: NAME, provider: PROVIDER }),
        annotations: READ_ONLY,
    }, async ({ domain, provider }) => {
        try {
            return text(await recordSummary(domain.trim(), normaliseProvider(provider)));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("email_records", {
        title: "Email DNS check",
        description: "Mail setup for a domain: MX hosts, SPF, DMARC and CAA, plus a note about anything missing.",
        inputSchema: z.object({ domain: NAME, provider: PROVIDER }),
        annotations: READ_ONLY,
    }, async ({ domain, provider }) => {
        try {
            return text(await emailRecords(domain.trim(), normaliseProvider(provider)));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("caa_records", {
        title: "CAA records",
        description: "Which certificate authorities may issue TLS certificates for a domain, " +
            "and whether any authority is allowed.",
        inputSchema: z.object({ domain: NAME, provider: PROVIDER }),
        annotations: READ_ONLY,
    }, async ({ domain, provider }) => {
        try {
            return text(await caaRecords(domain.trim(), normaliseProvider(provider)));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("reverse_lookup", {
        title: "Reverse DNS lookup",
        description: "Turn an IPv4 or IPv6 address into its hostname by querying the PTR record.",
        inputSchema: z.object({
            ip: z.string().describe("IPv4 address, e.g. 8.8.8.8, or an IPv6 address"),
            provider: PROVIDER,
        }),
        annotations: READ_ONLY,
    }, async ({ ip, provider }) => {
        try {
            return text(await reverseLookup(ip, normaliseProvider(provider)));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("providers", {
        title: "List resolvers",
        description: "The keyless DoH resolvers this server can query, and the record types it understands.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => text(providersHelp()));
    server.registerTool("dnssec_check", {
        title: "DNSSEC check",
        description: "Whether a zone is signed and the resolver validated it: DNSKEY and DS records plus the AD flag.",
        inputSchema: z.object({ domain: NAME, provider: PROVIDER }),
        annotations: READ_ONLY,
    }, async ({ domain, provider }) => {
        try {
            return text(await dnssecCheck({ domain, provider }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("propagation_check", {
        title: "Propagation check",
        description: "Resolve one record through Cloudflare, Google and AdGuard and say whether they agree - catches a DNS change that has not propagated.",
        inputSchema: z.object({
            name: NAME,
            type: TYPE,
            provider: z.enum(["cloudflare", "google", "adguard"]).describe("Ask only this resolver (default: all three)").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ name, type, provider }) => {
        try {
            return text(await propagationCheck({ name, type, provider }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("txt_contains", {
        title: "Find TXT value",
        description: "Check whether any TXT record on a domain contains a given string, for example a site-verification token or an SPF include.",
        inputSchema: z.object({
            domain: NAME,
            value: z.string().describe("Text to look for inside the TXT records"),
            provider: PROVIDER,
        }),
        annotations: READ_ONLY,
    }, async ({ domain, value, provider }) => {
        try {
            return text(await txtContains({ domain, value, provider }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("diagnose_lookup", {
        title: "Diagnose a lookup",
        description: "Says exactly why a lookup returned what it did: answered, NODATA where the name exists but has no record of that type, NXDOMAIN where the name does not exist, SERVFAIL, REFUSED or a malformed query, each with the next step that actually fits. When it is not a clean answer it re-runs the query on the other resolvers, because failing everywhere and failing on one resolver have opposite remedies.",
        inputSchema: z.object({
            name: z.string().describe("Hostname to diagnose, for example www.example.com."),
            type: z.string().optional().describe("Record type to ask for, default A. Also AAAA, MX, TXT, NS, SOA, CAA, SRV, PTR, CNAME, DS or DNSKEY."),
            provider: z.string().optional().describe("Resolver to use, default cloudflare. Others: google, adguard."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: diagnose_lookup ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_doh_diagnose_lookup", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("delegation_chain", {
        title: "Delegation chain",
        description: "Walks the NS delegation for a domain from the TLD downwards, the order a resolver actually follows, printing the name servers at each level and the zone's primary. It then checks each name server of the final zone for an address record and flags a lame delegation, which is a parent pointing at servers that cannot answer.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to walk, for example www.example.com or example.com."),
            max_hops: z.number().int().min(1).max(20).default(8).describe("Maximum labels to walk down, default 8"),
            provider: z.string().optional().describe("Resolver to use, default cloudflare."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: delegation_chain ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_doh_delegation_chain", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("wildcard_check", {
        title: "Wildcard DNS check",
        description: "Probes several random labels under a domain to find out whether the zone answers for names that were never created, at A, CNAME and TXT. A wildcard is the usual reason a mistyped or decommissioned hostname still resolves, and the reason a certificate can be issued for a name you never configured.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to test, for example example.com."),
            provider: z.string().optional().describe("Resolver to use, default cloudflare."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wildcardCheck(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
