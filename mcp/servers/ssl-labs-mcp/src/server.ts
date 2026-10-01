import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { analyze } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ssl-labs-mcp", version: "1.0.0" })
  server.registerTool(
    "analyze",
    {
      title: "Analyze",
      description: "Grade a host with SSL Labs.",
      inputSchema: z.object( { host: z.string().describe("Host name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await analyze(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "certificate_log",
    {
      title: "Certificate log",
      description: "Search the crt.sh Certificate Transparency log for the certificates issued for a domain: names covered, issuer and validity window.",
      inputSchema: z.object( { domain: z.string().describe("Domain like example.org."), limit: z.number().int().min(1).max(25).default(8).describe("Max certificates listed."), include_expired: z.boolean().default(false).describe("Include already expired certificates.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: certificate_log ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ssl_labs_certificate_log", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "caa_records",
    {
      title: "CAA records",
      description: "Look up the CAA DNS records that say which certificate authorities are allowed to issue for a domain.",
      inputSchema: z.object( { domain: z.string().describe("Domain like example.org.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: caa_records ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ssl_labs_caa_records", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
