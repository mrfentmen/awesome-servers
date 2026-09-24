import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { validateBatch } from "./api.js"
import { validateEmail } from "./api.js"

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
      description: "Check an email address format, MX record, and disposable status.",
      inputSchema: z.object( { email: z.string().describe("Email address to validate.") }),
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
      description: "Check a list of comma separated email addresses.",
      inputSchema: z.object( { emails: z.string().describe("Comma separated email addresses.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await validateBatch(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
