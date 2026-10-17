import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkDomain, disposableDomains, extractEmails, normalizeEmail, validateBatch, validateEmail, emailAuthRecords, mxHealth, correctTypo, aliasVariants } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "email-validator-mcp", version: "1.0.0" })
  server.registerTool(
    "validate_email",
    {
      title: "Validate email",
      description:
        "Check one email address: format, live MX records, disposable-domain status, role account (info@, support@) " +
        "and whether it is a free provider.",
      inputSchema: z.object({
        email: z.string().describe("Email address to validate."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await validateEmail(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "validate_batch",
    {
      title: "Validate batch",
      description: "Validate up to 25 addresses at once and get a count of well-formed, malformed and risky ones.",
      inputSchema: z.object({
        emails: z.string().describe("Comma or space separated email addresses (max 25)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await validateBatch(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "check_domain",
    {
      title: "Check domain",
      description: "Domain-level mail check: MX records, A records, and whether the domain is a disposable or free provider.",
      inputSchema: z.object({
        domain: z.string().describe("Domain name, e.g. 'example.com' (a leading @ is fine)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await checkDomain(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "normalize_email",
    {
      title: "Normalize email",
      description:
        "Canonical form of an address: lowercase the domain, drop the +tag, and remove Gmail dots, " +
        "so duplicates collapse to one record.",
      inputSchema: z.object({
        email: z.string().describe("Email address to normalise."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(normalizeEmail(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "extract_emails",
    {
      title: "Extract emails",
      description: "Pull every unique email address out of a block of text, flagging any disposable domains.",
      inputSchema: z.object({
        text: z.string().describe("Text to scan, e.g. a pasted email thread or CSV cell."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(extractEmails(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "disposable_domains",
    {
      title: "Disposable domains",
      description: "List the known disposable email domains this server checks against.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(40).describe("How many domains to list"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(disposableDomains(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    "email_auth_records",
    {
      title: "Email auth records",
      description:
        "The full anti-spoofing picture for a domain: MX hosts, SPF with its all-rule, DMARC policy and DKIM selectors.",
      inputSchema: z.object({
        domain: z.string().describe("Domain name, e.g. 'example.com' (a leading @ is fine)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await emailAuthRecords(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "mx_health",
    {
      title: "MX health",
      description: "Every MX host for a domain, whether it resolves to an A record, and its reverse DNS.",
      inputSchema: z.object({
        domain: z.string().describe("Domain name, e.g. 'example.com' (a leading @ is fine)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await mxHealth(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "correct_typo",
    {
      title: "Correct typo",
      description:
        "Suggests the mail provider a mistyped domain probably meant, e.g. gmial.com -> gmail.com, without contacting the domain.",
      inputSchema: z.object({
        email: z.string().describe("Email address that may contain a typo."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(correctTypo(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "smtp_mailbox_check",
    {
      title: "SMTP mailbox check",
      description: "Asks the receiving mail server whether a specific address actually exists, using an SMTP RCPT TO probe after negotiating with each MX host in priority order. An MX record only proves the domain accepts mail somewhere, not that one mailbox is real, so this is the only real existence signal available. Also probes a random address to detect catch-all domains, where a success reply means nothing. Distinguishes a genuine no-such-user from a network failure or a greylisted deferral, and never reports an unreachable server as an invalid address.",
      inputSchema: z.object({
        email: z.string().describe("Address to probe, e.g. someone@example.com"),
        check_catch_all: z.boolean().default(true).describe("Also probe a random address to detect a catch-all domain. Default true"),
        timeout_ms: z.number().int().min(2000).max(20000).default(8000).describe("Per-host timeout in ms, default 8000"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement check locally (paywall removed)
    try { return textError("Not yet implemented: check") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "spf_evaluate",
    {
      title: "Evaluate SPF for a sender IP",
      description: "Runs RFC 7208 SPF evaluation of a sender IP against a domain's actual record: walks every mechanism in order, resolves a, mx and include recursively, applies the + - ~ ? qualifiers, and returns pass, fail, softfail, neutral, none, permerror or temperror with the full chain of reasoning and the DNS lookup count. Existing tools only print the SPF record; this one tells you what it actually decides, and distinguishes a broken record from a deliberate failure.",
      inputSchema: z.object({
        domain: z.string().describe("Domain whose SPF record should be evaluated, e.g. example.com"),
        ip: z.string().describe("Sender IP address to evaluate, e.g. 203.0.113.10"),
        include_record: z.boolean().default(true).describe("Show the raw SPF record. Default true"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement evaluate locally (paywall removed)
    try { return textError("Not yet implemented: evaluate") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "alias_variants",
    {
      title: "Alias variants of an address",
      description: "Derives the addresses that reach the same inbox as a given one: the plus-tag and sub-address forms, the Gmail and Googlemail dot-stripped equivalents, and the providers that document plus addressing as a real feature. Flags role addresses, free providers and code-hosting domains where a valid SMTP result does not mean a deliverable person. Instant and entirely local, with no DNS or network access.",
      inputSchema: z.object({
        email: z.string().describe("Address to expand, e.g. someone+news@example.com"),
        max: z.number().int().min(1).max(200).default(40).describe("Variants to return, default 40"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await aliasVariants(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
