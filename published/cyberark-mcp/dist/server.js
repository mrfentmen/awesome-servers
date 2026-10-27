import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { breachCatalog, breachDetail, checkPassword, checkPasswords, domainEmailSecurity, generatePassword, passwordStrength, identifyHash, hashText, breachTimeline, subdomainInventory, dnssecStatus, dnsRecordInventory, passwordVariationAudit } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "cyberark-mcp",
        version: "2.0.0",
    });
    server.registerTool("check_password", {
        title: "Check if a password is breached",
        description: "Check a password against known data breaches using k-anonymity, so only five characters of its SHA-1 hash are sent and the password itself never leaves your machine. No API key needed.",
        inputSchema: z.object({
            password: z.string().describe("The password to check. It is hashed locally and never stored."),
        }),
        annotations: READ_ONLY,
    }, async ({ password }) => {
        try {
            return text(await checkPassword({ password }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("check_passwords", {
        title: "Check several passwords",
        description: "Check up to 10 passwords for known breaches in one call and report how many have already been leaked.",
        inputSchema: z.object({
            passwords: z.array(z.string()).describe("Passwords to check, maximum 10."),
        }),
        annotations: READ_ONLY,
    }, async ({ passwords }) => {
        try {
            return text(await checkPasswords({ passwords }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("password_strength", {
        title: "Score password strength",
        description: "Score a password offline: entropy, character classes, common-word, keyboard and sequence patterns, plus an estimated offline crack time and a clear verdict.",
        inputSchema: z.object({
            password: z.string().describe("The password to score. Analysis happens locally."),
        }),
        annotations: READ_ONLY,
    }, async ({ password }) => {
        try {
            return text(await passwordStrength({ password }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_password", {
        title: "Generate a strong password",
        description: "Generate a random password from a cryptographically secure source, with control over length and character classes, and report its estimated crack time.",
        inputSchema: z.object({
            length: z.number().describe("Password length, 8 to 128. Defaults to 20.").optional(),
            symbols: z.boolean().describe("Include symbols. Defaults to true.").optional(),
            digits: z.boolean().describe("Include digits. Defaults to true.").optional(),
            upperCase: z.boolean().describe("Include upper case letters. Defaults to true.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ length, symbols, digits, upperCase }) => {
        try {
            return text(await generatePassword({ length, symbols, digits, upperCase }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("breach_catalog", {
        title: "Browse known breaches",
        description: "List breaches from the Have I Been Pwned catalogue, largest first, filtered by company domain or year, with the number of accounts and the kinds of data exposed.",
        inputSchema: z.object({
            domain: z.string().describe("Filter by company domain, for example adobe.com.").optional(),
            year: z.number().describe("Filter by breach year, for example 2019.").optional(),
            limit: z.number().describe("How many breaches to list, 1 to 100. Defaults to 15.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ domain, year, limit }) => {
        try {
            return text(await breachCatalog({ domain, year, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("breach_detail", {
        title: "Breach details",
        description: "Look up one breach by name and get its date, exposed account count, verification status and the classes of data leaked.",
        inputSchema: z.object({
            name: z.string().describe("Breach name such as LinkedIn or Adobe."),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(await breachDetail({ name }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_email_security", {
        title: "Domain email security audit",
        description: "Audit a domain's anti-spoofing setup: SPF, DMARC, DKIM selectors, MX records and CAA, graded A to F with the exact gaps to fix.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to audit, for example example.com."),
        }),
        annotations: READ_ONLY,
    }, async ({ domain }) => {
        try {
            return text(await domainEmailSecurity({ domain }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("identify_hash", {
        title: "Identify a hash",
        description: "Identify the likely algorithm behind a hash string — bcrypt, Argon2, crypt formats, MD5, SHA-1, SHA-256, SHA-512 and more — entirely offline.",
        inputSchema: z.object({
            hash: z.string().describe("One hash string to identify."),
        }),
        annotations: READ_ONLY,
    }, async ({ hash }) => {
        try {
            return text(await identifyHash({ hash }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hash_text", {
        title: "Hash text",
        description: "Compute MD5, SHA-1, SHA-256 or SHA-512 digests of a string locally, for checksum and fingerprint checks.",
        inputSchema: z.object({
            text: z.string().describe("Text to hash."),
            algorithm: z.string().describe("md5, sha1, sha256, sha512, or all (default all).").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ text: value, algorithm }) => {
        try {
            return text(await hashText({ text: value, algorithm }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("breach_timeline", {
        title: "Breach timeline",
        description: "Year-by-year view of known breaches from Have I Been Pwned: how many sites were breached and how many accounts were exposed.",
        inputSchema: z.object({
            from: z.number().describe("First year to include, defaults to 2004.").optional(),
            to: z.number().describe("Last year to include, defaults to the current year.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ from, to }) => {
        try {
            return text(await breachTimeline({ from, to }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("subdomain_inventory", {
        title: "Subdomain inventory",
        description: "Resolve common subdomains of a domain and show what each points to, flagging third-party CNAME targets that no longer resolve.",
        inputSchema: z.object({
            domain: z.string().describe("Your domain, e.g. example.com."),
            names: z.string().describe("Subdomain labels to check instead of the default 20, comma separated.").optional(),
            limit: z.number().describe("How many labels to check, 1-40. Defaults to 20.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ domain, names, limit }) => {
        try {
            return text(await subdomainInventory({ domain, names, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dns_record_inventory", {
        title: "DNS record inventory",
        description: "The whole public DNS picture for one domain in a single pass: delegation, A and AAAA endpoints, mail exchangers, text policy records, zone authority and CAA. Notes a null MX, a missing MX where mail is expected, an absent CAA that lets any CA issue for the domain, and an SOA serial that is not epoch-based.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to inventory, for example example.com."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dnsRecordInventory(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dnssec_status", {
        title: "DNSSEC status",
        description: "Whether a domain is genuinely DNSSEC-signed, following the chain: the DS record in the parent zone, the DNSKEYs in the child, the RRSIGs returned with a normal query, and whether the resolver set the Authenticated Data flag. Separates a domain that is zoned but never delegated from one whose chain is genuinely broken, and explains what that means for email spoofing.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to check, for example example.com."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dnssecStatus(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("password_variation_audit", {
        title: "Password variation audit",
        description: "Builds the mutation dictionary a credential-stuffing attack would use from one base word, crossing case forms and leetspeak with the current and previous year plus common numeric and symbol suffixes, then checks every candidate against Have I Been Pwned. Shows which variants are already leaked and how many times, and which are still clean but still predictable.",
        inputSchema: z.object({
            base: z.string().describe("Base word, name or company to mutate, e.g. acme."),
            year: z.number().int().optional().describe("Year to use in the suffixes, defaults to the current year"),
            limit: z.number().int().min(5).max(80).default(40).describe("Candidates to check, 5-80. Each costs one HIBP range request, default 40"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await passwordVariationAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
