import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkUrl, dnsPropagation, errorMessage, portCheck, sslChain, uptimeReport, header_audit, dns_records, http_timing } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "statuscake-mcp",
    version: "2.0.0",
  })

  server.registerTool(
    "check_url",
    {
      title: "Check URL up or down",
      description: "Uptime-check a URL right now and report the HTTP status, response time and where it redirected. No API key needed.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname to check, for example https://example.com."),
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
    "port_check",
    {
      title: "TCP port check",
      description: "Try to open a TCP connection to up to 10 ports on a host and report which are open, how fast they answered and what service usually runs there.",
      inputSchema: z.object({
        host: z.string().describe("Hostname to probe, for example example.com."),
        ports: z.array(z.number()).describe("Ports to test, maximum 10. Defaults to 443 and 80.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ host, ports }) => {
      try {
        return text(await portCheck({ host, ports }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "ssl_chain",
    {
      title: "SSL certificate chain",
      description: "Walk a host's full TLS certificate chain and show every certificate with its issuer and days until expiry, plus names the leaf certificate covers.",
      inputSchema: z.object({
        host: z.string().describe("Hostname to inspect, for example example.com."),
      }),
      annotations: READ_ONLY,
    },
    async ({ host }) => {
      try {
        return text(await sslChain({ host }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "dns_propagation",
    {
      title: "DNS propagation check",
      description: "Resolve a domain through Cloudflare, Google and AdGuard public resolvers and report whether they all give the same answer, plus the lowest TTL.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to resolve, for example example.com."),
        type: z.string().describe("Record type such as A, AAAA, CNAME, MX or TXT. Defaults to A.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ domain, type }) => {
      try {
        return text(await dnsPropagation({ domain, type }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "uptime_report",
    {
      title: "Full uptime report",
      description: "Run the whole monitoring battery on a host in one call: HTTP reachability, TCP port, SSL certificate expiry, DNS record and a single healthy verdict.",
      inputSchema: z.object({
        url: z.string().describe("URL to report on, for example https://example.com."),
      }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        return text(await uptimeReport({ url }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "check_hosts",
    {
      title: "Check several hosts",
      description: "Uptime-check up to 10 hosts at once and report a compact up or down line with status and response time for each.",
      inputSchema: z.object({
        urls: z.array(z.string()).describe("URLs to check, maximum 10."),
      }),
      annotations: READ_ONLY,
    },
    async ({ urls }) => {
      try {
        const list = (urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10)
        if (!list.length) return text("Provide up to 10 URLs to check.")
        const rows: string[] = []
        let up = 0
        for (const url of list) {
          try {
            const r = await checkUrl({ url })
            if (r.startsWith("UP")) up += 1
            rows.push(r.split("\n").slice(0, 2).join(" | "))
          } catch (e) {
            rows.push(`DOWN — ${url} (${errorMessage(e)})`)
          }
        }
        return text(`Checked ${list.length} host(s): ${up} up, ${list.length - up} down.\n\n${rows.join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "header_audit",
    {
      title: "Header audit",
      description: "Fetch a URL and report every response header it returned, with the eight security-relevant ones marked present or absent and what each one is for, so a missing HSTS or content security policy is visible. An optional path audits a different route on the same host, since headers are often set per route. The existing check_url reads only the server header out of every response it makes.",
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
      description: "Read the DNS record types the existing propagation tool never asks for: AAAA, MX, TXT, NS, CNAME, SOA and CAA alongside A. Every type is asked of two resolvers over DoH and compared, so a record still in flight shows as a disagreement between them rather than as a single answer. The existing dns_propagation queries A records only.",
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
    "http_timing",
    {
      title: "Request phase timing",
      description: "Break a request to a host into its phases, timing DNS resolution, the TCP connect, the TLS handshake and the request to the last byte separately and reporting the median over repeated attempts, the first attempt against the rest so a cold start is visible, and which phase dominates. The existing check_url gives one total per host, so a slow handshake is indistinguishable from a slow server.",
      inputSchema: z.object({
        url: z.string().describe("URL or hostname to time, e.g. https://example.com."),
        repeats: z.number().int().min(1).max(5).optional().describe("How many attempts to time. Default 3."),
      }),
      annotations: READ_ONLY,
    },
    async ({ url, repeats }) => {
      // ---- paywall: http_timing ----
      const paywallMessage = await premiumRequired("http_timing")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await http_timing({ url, repeats })) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
