import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { email, ipBreaches } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "hudsonrock-mcp", version: "1.0.0" })
  server.registerTool(
    "email",
    {
      title: "Email",
      description: "Check if an email appeared in infostealer breaches.",
      inputSchema: z.object( { email: z.string().describe("Email address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await email(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "domain_exposure",
    {
      title: "Domain exposure",
      description: "Infostealer exposure summary for a company domain: infected machines, exposed employees, users and third parties, infostealer families and most exposed applications.",
      inputSchema: z.object( { domain: z.string().describe("Domain like tesla.com."), apps: z.number().describe("Max items in the family and application lists.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement exposure locally (paywall removed)
    try { return textError("Not yet implemented: exposure") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "ip_breaches",
    {
      title: "IP breaches",
      description: "Infostealer breach records tied to an IP address, with machine name, OS and antivirus seen at compromise time.",
      inputSchema: z.object( { ip: z.string().describe("IP address."), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ipBreaches(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
