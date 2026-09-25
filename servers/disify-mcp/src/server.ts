import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { check, checkBulk, checkDomain, mxRecords } from "./api.js"

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
  return server
}
