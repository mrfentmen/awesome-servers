import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  checkServices,
  dnsPropagation,
  errorMessage,
  portCheck,
  serviceStatus,
  sslChain,
  statusSummary,
} from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "statping-mcp", version: "1.0.0" })

  server.registerTool(
    "status_summary",
    {
      title: "Status summary",
      description: "The rollup a status page shows: how many services are up, which are down, the slowest one and the overall state.",
      inputSchema: z.object({
        urls: z.array(z.string()).describe("Up to 10 service URLs to roll up, for example ['https://api.example.com', 'https://example.com'].")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await statusSummary(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "check_services",
    {
      title: "Check services",
      description: "Up/down sweep of up to 10 services in one call, with status code and response time for each.",
      inputSchema: z.object({
        urls: z.array(z.string()).describe("Up to 10 service URLs to check in one call.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await checkServices(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "service_status",
    {
      title: "Service status",
      description: "Detail for one service: HTTP status, response time, server, redirect chain and the first text on the page.",
      inputSchema: z.object({
        url: z.string().describe("Service URL or hostname, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await serviceStatus(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "port_check",
    {
      title: "Port check",
      description: "Check whether TCP ports on a host accept connections, with the service usually found on each port.",
      inputSchema: z.object({
        host: z.string().describe("Hostname, for example db.example.com."),
        ports: z.array(z.number()).describe("Up to 10 TCP ports, for example [443, 5432]. Defaults to 443 and 80.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await portCheck(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "dns_propagation",
    {
      title: "DNS propagation",
      description: "Ask Cloudflare, Google and AdGuard for the same record and report whether they agree, plus the lowest TTL.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to look up, for example example.com."),
        type: z.string().describe("Record type: A, AAAA, NS, MX, TXT or CAA. Defaults to A.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await dnsPropagation(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "ssl_chain",
    {
      title: "TLS chain",
      description: "The whole certificate chain from the live handshake: leaf, intermediates, expiry and whether the chain is trusted.",
      inputSchema: z.object({
        host: z.string().describe("Hostname to read the chain from, for example example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await sslChain(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
