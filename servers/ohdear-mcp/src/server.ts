import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  checkMany,
  checkUrl,
  dnsHealth,
  errorMessage,
  securityHeaders,
  siteReport,
  sslCertificate,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ohdear-mcp",
    version: "2.0.0",
  })

  server.registerTool(
    "check_url",
    {
      title: "Check URL up or down",
      description: "Test whether a URL is up right now: HTTP status, response time and the full redirect chain. No API key needed.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname to test, for example https://example.com."),
      }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        return text(await checkUrl({ url }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "check_many",
    {
      title: "Check many URLs",
      description: "Uptime-check up to 10 URLs in one call and report how many are up, with status and response time for each.",
      inputSchema: z.object({
        urls: z.array(z.string()).describe("URLs to check, maximum 10."),
      }),
      annotations: READ_ONLY,
    },
    async ({ urls }) => {
      try {
        return text(await checkMany({ urls }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "ssl_certificate",
    {
      title: "SSL certificate check",
      description: "Read a host's live TLS certificate: issuer, validity dates, days until expiry, covered names and whether the chain is trusted.",
      inputSchema: z.object({
        host: z.string().describe("Hostname to inspect, for example example.com."),
      }),
      annotations: READ_ONLY,
    },
    async ({ host }) => {
      try {
        return text(await sslCertificate({ host }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "dns_health",
    {
      title: "DNS health",
      description: "Resolve a domain's A, AAAA, NS, MX, TXT and CAA records live and flag missing core records or a missing SPF policy.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to inspect, for example example.com."),
      }),
      annotations: READ_ONLY,
    },
    async ({ domain }) => {
      try {
        return text(await dnsHealth({ domain }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "security_headers",
    {
      title: "Security headers audit",
      description: "Grade a site A-F on the six recommended security headers (HSTS, CSP, frame options, content-type options, referrer and permissions policy).",
      inputSchema: z.object({
        url: z.string().describe("URL to audit, for example https://example.com."),
      }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        return text(await securityHeaders({ url }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "site_report",
    {
      title: "Full site report",
      description: "One health report for a site: reachability and response time, TLS certificate expiry, DNS address and a clear healthy or needs-attention verdict.",
      inputSchema: z.object({
        url: z.string().describe("URL to report on, for example https://example.com."),
      }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        return text(await siteReport({ url }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
