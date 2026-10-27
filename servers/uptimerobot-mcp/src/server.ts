import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  checkEndpoints,
  checkUrl,
  dnsHealth,
  errorMessage,
  monitorReport,
  portMonitor,
  sslExpiry,
} from "./api.js"

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

  return server
}
