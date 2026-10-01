import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { inspectUrl } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "http-inspector-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_url",
    {
      title: "Inspect url",
      description: "Fetch a URL and report status and headers.",
      inputSchema: z.object( { url: z.string().describe("The URL to inspect.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await inspectUrl(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "dns_records",
    {
      title: "Dns records",
      description: "Look up A, AAAA, MX, NS, TXT, CNAME, CAA or SOA records for a host using Cloudflare DNS over HTTPS.",
      inputSchema: z.object({ host: z.string().describe("Hostname or URL, for example github.com."), types: z.string().describe("Comma separated record types. Defaults to A,AAAA,MX,NS.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: dns_records ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_http_inspector_dns_records", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "redirect_chain",
    {
      title: "Redirect chain",
      description: "Follow a URL one redirect at a time and report each hop: status code, elapsed milliseconds and the next location.",
      inputSchema: z.object({ url: z.string().describe("The URL to trace."), max_hops: z.number().describe("Max hops, 1-20, default 8.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: redirect_chain ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_http_inspector_redirect_chain", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "security_txt",
    {
      title: "Security txt",
      description: "Fetch a site's /.well-known/security.txt and report its contact, policy, expiry and other fields.",
      inputSchema: z.object({ host: z.string().describe("Hostname or URL, for example anthropic.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: security_txt ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_http_inspector_security_txt", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
