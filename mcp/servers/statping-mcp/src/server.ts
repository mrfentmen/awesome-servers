import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkServices, dnsPropagation, errorMessage, portCheck, serviceStatus, sslChain, statusSummary, header_audit, dns_records, cert_forecast } from "./api.js"
import { premiumRequired } from "./license.js"

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

  server.registerTool(
    "header_audit",
    {
      title: "Header audit",
      description: "Fetch a URL and report every response header it returned, with the security-relevant ones marked present or absent and what each one is for, so a missing HSTS or content security policy is visible. An optional path audits a different route on the same host, since headers are often set per route. The existing service_status reads only content-type, server and location out of every response it makes.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname, e.g. https://example.com."),
        path: z.string().optional().describe("Extra path to audit on the same host, e.g. /api/health."),
      }),
      annotations: READ_ONLY,
    },
    async ({ url, path }) => {
      // ---- paywall: header_audit ----
      const paywallMessage = await premiumRequired("header_audit")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await header_audit({ url, path })) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "dns_records",
    {
      title: "DNS records",
      description: "Read the DNS record types the existing propagation tool never asks for: AAAA, MX, TXT, NS, CNAME, SOA and CAA alongside A. Every type is asked of two resolvers over DoH and compared, so a record still in flight shows as a disagreement between them rather than as a single answer. The existing DNS tool queries A records only.",
      inputSchema: z.object({
        domain: z.string().describe("Domain name, e.g. example.com."),
        types: z.string().optional().describe("Comma separated record types. Default A, AAAA, MX, TXT, NS."),
      }),
      annotations: READ_ONLY,
    },
    async ({ domain, types }) => {
      try { return text(await dns_records({ domain, types })) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "cert_forecast",
    {
      title: "Certificate forecast",
      description: "Judge a host's certificate by what it leaves you rather than by the chain alone: how many days of validity remain and how many the term has in total, the key size and curve, whether the subject alternative names actually cover the hostname you asked about, whether the chain is trusted, the handshake time, and what to do about a short term or a key under 2048 bits. The existing TLS chain tool reports the chain and trust but none of these.",
      inputSchema: z.object({
        host: z.string().describe("Hostname to connect to, e.g. example.com."),
        port: z.number().int().min(1).max(65535).optional().describe("TLS port. Default 443."),
        warnDays: z.number().int().min(1).max(365).optional().describe("Days of remaining validity that count as urgent. Default 30."),
      }),
      annotations: READ_ONLY,
    },
    async ({ host, port, warnDays }) => {
      // ---- paywall: cert_forecast ----
      const paywallMessage = await premiumRequired("cert_forecast")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await cert_forecast({ host, port, warnDays })) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
