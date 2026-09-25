import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  checkDomain,
  disposableDomains,
  extractEmails,
  normalizeEmail,
  validateBatch,
  validateEmail,
} from "./api.js"

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
      try { return text(await validateEmail(args)) } catch (e) { return textError(error(e)) }
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
      try { return text(await validateBatch(args)) } catch (e) { return textError(error(e)) }
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
      try { return text(await checkDomain(args)) } catch (e) { return textError(error(e)) }
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
      try { return text(normalizeEmail(args)) } catch (e) { return textError(error(e)) }
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
      try { return text(extractEmails(args)) } catch (e) { return textError(error(e)) }
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
      try { return text(disposableDomains(args)) } catch (e) { return textError(error(e)) }
    }
  )
  return server
}
