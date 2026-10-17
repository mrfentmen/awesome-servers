import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { checkMany, checkUrl, dnsHealth, errorMessage, securityHeaders, siteReport, sslCertificate, archivedSnapshot } from "./api.js"
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "certificate_transparency",
    {
      title: "Certificate transparency",
      description: "Every certificate a public transparency log has recorded for a domain, not just the one being served: how many exist, which issuers signed them, how many names they cover, how many are still valid, which expires soonest, and the most recently issued with their validity windows.",
      inputSchema: z.object({
        domain: z.string().describe("Domain or URL to look up, e.g. mozilla.org."),
        limit: z.number().describe("How many recent certificates to list, 1-12.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement transparency locally (paywall removed)
    try { return textError("Not yet implemented: transparency") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "domain_registration",
    {
      title: "Domain registration",
      description: "Registry facts from RDAP about a domain itself: registrar and its IANA handle, registration and expiry dates with the days remaining, when it was last changed or transferred, whether DNSSEC is signed, which registry locks are set, and the authoritative nameservers.",
      inputSchema: z.object({ domain: z.string().describe("Domain or URL to look up, e.g. mozilla.org.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement registration locally (paywall removed)
    try { return textError("Not yet implemented: registration") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "archived_snapshot",
    {
      title: "Archived snapshot",
      description: "What the Wayback Machine has of a page: the most recent capture with its date, age and the archive's own status code, or the closest capture to a date you give. Reports plainly when the archive holds nothing.",
      inputSchema: z.object({
        url: z.string().describe("Page or site to look up, e.g. example.com or https://example.com/blog."),
        at: z.string().describe("Point in time as YYYY or YYYYMMDD, e.g. 2020 or 20200101.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await archivedSnapshot(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
