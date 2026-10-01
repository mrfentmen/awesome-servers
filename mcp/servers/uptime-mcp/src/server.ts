import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { cert } from "./local.js"

import { check, maintenanceWindows } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "uptime-mcp", version: "1.0.0" })
  server.registerTool(
    "check",
    {
      title: "Check",
      description: "HTTP status and latency for a URL.",
      inputSchema: z.object( { url: z.string().describe("URL like https://example.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await check(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "cert",
    {
      title: "Cert",
      description: "TLS certificate expiry for a host.",
      inputSchema: z.object( { host: z.string().describe("Hostname like example.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cert(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "dns_records",
    {
      title: "DNS records",
      description: "Resolve a hostname's DNS records through Google DNS-over-HTTPS: A, AAAA, MX, TXT, NS, SOA, CNAME, PTR, SRV or CAA.",
      inputSchema: z.object( { host: z.string().describe("Hostname like example.com."), type: z.string().describe("Record type like A, MX, TXT, CAA.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: dns_records ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_uptime_dns_records", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "service_status",
    {
      title: "Service status",
      description: "Live status page summary for a major service: overall indicator, components that are not operational and open incidents.",
      inputSchema: z.object( { service: z.string().describe("github, cloudflare or reddit.").optional(), limit: z.number().int().min(1).max(40).default(10).describe("Max components or incidents listed.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: service_status ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_uptime_service_status", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "incident_history",
    {
      title: "Incident history",
      description: "Recent GitHub incidents, including resolved outages, timestamps and the latest published update.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(20).optional().describe("Maximum events, defaults to 5.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: incident_history ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_uptime_incident_history", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "maintenance_windows",
    {
      title: "Maintenance windows",
      description: "Published GitHub maintenance windows with start and end times, state and latest update; includes completed work.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(20).optional().describe("Maximum events, defaults to 5.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await maintenanceWindows(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
