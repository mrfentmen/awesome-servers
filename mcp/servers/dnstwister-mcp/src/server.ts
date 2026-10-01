import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { fuzz, whois, fuzzSummary } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "dnstwister-mcp", version: "1.0.0" })
  server.registerTool(
    "fuzz",
    {
      title: "Fuzz",
      description: "Fuzz a domain for lookalike domains.",
      inputSchema: z.object( { domain: z.string().describe("Domain to fuzz.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fuzz(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "whois",
    {
      title: "Whois",
      description: "Get whois data for a domain.",
      inputSchema: z.object( { domain: z.string().describe("Domain.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await whois(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "mx_check",
    {
      title: "MX check",
      description: "Whether one domain publishes an MX record, so it can receive mail. A different question from listing its lookalikes.",
      inputSchema: z.object( { domain: z.string().describe("Domain to check, e.g. example.com.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: mx_check ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_dnstwister_mx_check", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "parked_report",
    {
      title: "Parked report",
      description: "The parking score for one domain, whether it is dressed up like a real site and where it redirects to.",
      inputSchema: z.object( { domain: z.string().describe("Domain to check, e.g. example.com.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: parked_report ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_dnstwister_parked_report", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "fuzz_summary",
    {
      title: "Fuzz summary",
      description: "How a domain's lookalikes break down by the method that generated them, with real counts and examples, instead of the flat list.",
      inputSchema: z.object( { domain: z.string().describe("Domain to summarise, e.g. example.com."), top: z.number().describe("Example domains to show per method, 1-10. Defaults to 3.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fuzzSummary(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
