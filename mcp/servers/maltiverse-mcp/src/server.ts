import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ip } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "maltiverse-mcp", version: "1.0.0" })
  server.registerTool(
    "ip",
    {
      title: "Ip",
      description: "Threat data for an IP address.",
      inputSchema: z.object( { address: z.string().describe("IP address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ip(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "ip_registration",
    {
      title: "IP registration",
      description: "Authoritative RDAP registration record for an IP address, CIDR or AS number: range, country, status, whois server, remarks and abuse contacts.",
      inputSchema: z.object({
        resource: z.string().describe("IP address, CIDR or AS number, for example 1.1.1.1 or AS15169."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: ip_registration ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_maltiverse_ip_registration", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "domain_certificates",
    {
      title: "Domain certificates",
      description: "Unexpired TLS certificates seen by Certificate Transparency for a domain: common name, issuer and validity window.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to look up, for example github.com."),
        limit: z.number().describe("Max certificates, 1-25, default 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: domain_certificates ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_maltiverse_domain_certificates", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
