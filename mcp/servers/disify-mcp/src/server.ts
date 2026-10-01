import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { check, checkBulk, checkDomain, dnsLookup, dnssecCheck, domainSummary, emailAuth, lookalikeDomains, mxRecords, mxProviderProfile } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "disify-mcp", version: "1.0.0" })
  server.registerTool(
    "check",
    {
      title: "Check",
      description: "Validate an email address: format, disposable domain, DNS records.",
      inputSchema: z.object( { email: z.string().describe("Email address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await check(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "check_domain",
    {
      title: "Check domain",
      description: "Validate an email domain: disposable, free provider, whitelist and DNS status.",
      inputSchema: z.object( { domain: z.string().describe("Domain like example.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await checkDomain(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "check_bulk",
    {
      title: "Check bulk",
      description: "Validate up to 10 email addresses in one call and count how many are disposable.",
      inputSchema: z.object( { emails: z.array(z.string()).describe("Email addresses to check, maximum 10.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await checkBulk(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "mx_records",
    {
      title: "MX records",
      description: "List the MX mail hosts for a domain, useful for checking whether a mailbox can receive mail.",
      inputSchema: z.object( { domain: z.string().describe("Domain like example.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mxRecords(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "dns_lookup",
    {
      title: "DNS lookup",
      description: "Resolve live DNS records for a domain — A, AAAA, MX, NS, TXT, CNAME, SOA, CAA, PTR or SRV — via public DNS-over-HTTPS.",
      inputSchema: z.object( {
        domain: z.string().describe("Domain to resolve, for example example.com."),
        type: z.string().describe("Record type: A, AAAA, MX, NS, TXT, CNAME, SOA, CAA, PTR or SRV. Defaults to A.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dnsLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "domain_summary",
    {
      title: "Domain summary",
      description: "One report on a domain: disposable verdict plus live A, NS and MX records, so you can tell whether signups from it are trustworthy.",
      inputSchema: z.object( {
        domain: z.string().describe("Domain to summarise, for example gmail.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await domainSummary(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "dnssec_check",
    {
      title: "DNSSEC check",
      description: "Check whether a domain is DNSSEC signed: validating-resolver AD flag, DNSKEY records and the parent DS.",
      inputSchema: z.object( {
        domain: z.string().describe("Domain to check, for example cloudflare.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dnssecCheck(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "email_auth",
    {
      title: "Email authentication",
      description: "SPF, DMARC, DKIM and MX for a domain, so you can tell whether its mail can be spoofed.",
      inputSchema: z.object( {
        domain: z.string().describe("Domain to check, for example stripe.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await emailAuth(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "lookalike_domains",
    {
      title: "Lookalike domains",
      description: "Test typo, homoglyph and alternative-TLD variants of a domain and report which ones resolve.",
      inputSchema: z.object( {
        domain: z.string().describe("Domain to screen, for example yourbrand.com."),
        limit: z.number().describe("How many live lookalikes to show, 1-25, e.g. 10.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookalikeDomains(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "domain_registration",
    {
      title: "Domain registration age",
      description: "When a domain was actually registered, when it expires, who the registrar is, its status flags, nameservers and DNSSEC delegation, read from the registry's own RDAP record. Domain age is the strongest single indicator of a disposable phishing domain, and it is the one fact Disify and DNS lookups cannot tell you.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to look up, for example example.com."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: domain_registration ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_disify_domain_registration", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "typo_check",
    {
      title: "Typosquatting check",
      description: "Whether one specific email address looks like an impersonation of a real one. Compares the domain against 24 major providers and any brand you name using edit distance, and flags homoglyph substitutions, and separately examines the local part for the shapes credential-stuffing lists use: digits after a word, repeated characters, leetspeak, and trailing years. Distinct from lookalike_domains, which searches for registered lookalikes rather than judging the address you were given.",
      inputSchema: z.object({
        email: z.string().describe("The full address to assess, for example support@gmial.com."),
        brand: z.string().optional().describe("A brand or domain this address is claimed to be from, checked alongside the built-in provider list."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: typo_check ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_disify_typo_check", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "mx_provider_profile",
    {
      title: "Mail provider profile",
      description: "Resolves the MX records for a domain and works out which mail provider actually receives the mail, then states what that provider demands before it will accept anything, such as Amazon SES needing its own MAIL FROM domain, SendGrid needing a dedicated sending subdomain, or Zoho rejecting a second SPF record. Distinct from mx_records, which only lists the records.",
      inputSchema: z.object({
        domain: z.string().describe("Domain whose mail routing to profile, for example example.com."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mxProviderProfile(args)) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }
  )

  return server
}
