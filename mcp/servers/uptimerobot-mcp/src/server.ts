import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkEndpoints, checkUrl, dnsHealth, errorMessage, monitorReport, portMonitor, sslExpiry, multiRegionCheck, vendorUptime } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "uptimerobot-mcp", version: "1.0.0" })

  server.registerTool(
    "check_url",
    {
      title: "Check URL",
      description: "Is a page up right now: HTTP status, response time, server, redirect chain and the first text on the page.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await checkUrl(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "check_endpoints",
    {
      title: "Check many endpoints",
      description: "Up/down sweep of up to 10 URLs in one call, with status code and response time for each.",
      inputSchema: z.object({
        urls: z.array(z.string()).describe("Up to 10 URLs or hostnames to check in one call.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await checkEndpoints(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "port_monitor",
    {
      title: "Port monitor",
      description: "Check whether TCP ports on a host accept connections, with the service usually found on each port.",
      inputSchema: z.object({
        host: z.string().describe("Hostname, for example db.example.com."),
        ports: z.array(z.number()).describe("Up to 10 TCP ports, for example [443, 80, 22]. Defaults to 443 and 80.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await portMonitor(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "ssl_expiry",
    {
      title: "TLS expiry",
      description: "Days left on a site's TLS certificate, who issued it and whether the chain is trusted.",
      inputSchema: z.object({
        host: z.string().describe("Hostname to read the certificate from, for example example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await sslExpiry(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "dns_health",
    {
      title: "DNS health",
      description: "A, AAAA, NS, MX, TXT and CAA records for a domain, plus whether SPF is published.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to look up, for example example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await dnsHealth(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "monitor_report",
    {
      title: "Monitor report",
      description: "One call that runs the whole monitor sweep on a URL: reachability, TLS certificate and DNS, with a verdict.",
      inputSchema: z.object({
        url: z.string().describe("URL to run every check against, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await monitorReport(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "multi_region_check",
    {
      title: "Multi region check",
      description:
        "Requests the same URL from several countries at once and reports each node's country, city, network, HTTP status and response time, so a fault that only affects one region is visible. Complements a single-vantage-point check.",
      inputSchema: z.object({
        url: z.string().describe("URL to check, e.g. https://example.com"),
        nodes: z.number().describe("Nodes to ask, 1-8. Defaults to 4.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: multi_region_check ----
    const paywallMessage = await premiumRequired("multi_region_check")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await multiRegionCheck(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "vendor_uptime",
    {
      title: "Vendor uptime",
      description:
        "How UptimeRobot's own services have been behaving, from its public status board: every published monitor with its overall, 30-day and 90-day uptime ratios, the days that were not a clean 100%, and the current up/down counts.",
      inputSchema: z.object({
        limit: z.number().describe("Monitors listed, 1-20. Defaults to 8.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await vendorUptime(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
