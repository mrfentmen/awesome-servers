import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatPulse, ipReputation, OtxError, pulseIndicators, searchPulses, indicatorReport, indicatorPulses, indicatorUrls } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "otx-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_pulses",
    {
      title: "Search pulses",
      description: "Threat pulses by keyword with authors and indicator counts.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'ransomware', 'Mirai'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchPulses(query, limit)
        if (rows.length === 0) return text(`No pulses for "${query}".`)
        return text(rows.map((p, i) => formatPulse(p, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "pulse_indicators",
    {
      title: "Pulse indicators",
      description: "IOCs of one pulse: IPs, domains, hashes, URLs.",
      inputSchema: z.object({
        id: z.string().describe("Pulse id (use search_pulses)"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const rows = await pulseIndicators(id, limit)
        if (rows.length === 0) return text(`No indicators for pulse ${id}.`)
        return text(rows.map((r, i) => `${i + 1}. ${r}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "ip_reputation",
    {
      title: "IP reputation",
      description: "OTX reputation, country, and pulse memberships for an IPv4.",
      inputSchema: z.object({
        ip: z.string().describe("IPv4 address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ ip }) => {
      try {
        return text(await ipReputation(ip))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "indicator_report",
    {
      title: "Indicator report",
      description: "Full OTX record for any indicator - IP, domain, hostname, file hash or CVE - with reputation, ASN, geo and malware counts. No API key needed.",
      inputSchema: z.object( {
        indicator: z.string().describe("The indicator value, e.g. 8.8.8.8, example.com or a sha256 hash."),
        type: z.enum(["IPv4", "IPv6", "domain", "hostname", "file", "CVE", "URL"]).describe("Indicator type."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: indicator_report ----
    const paywallMessage = await premiumRequired("indicator_report")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await indicatorReport(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "indicator_pulses",
    {
      title: "Indicator pulses",
      description: "The community pulses an indicator belongs to, with author, date and tags. No API key needed.",
      inputSchema: z.object( {
        indicator: z.string().describe("The indicator value."),
        type: z.enum(["IPv4", "IPv6", "domain", "hostname", "file"]).describe("Indicator type."),
        limit: z.number().int().min(1).max(25).optional().describe("How many pulses to list, 1-25. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: indicator_pulses ----
    const paywallMessage = await premiumRequired("indicator_pulses")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await indicatorPulses(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "indicator_urls",
    {
      title: "Indicator URLs",
      description: "URLs an IP or domain has been seen talking to, with host and date. No API key needed.",
      inputSchema: z.object( {
        indicator: z.string().describe("The indicator value."),
        type: z.enum(["IPv4", "IPv6", "domain", "hostname"]).describe("Indicator type."),
        limit: z.number().int().min(1).max(25).optional().describe("How many URLs to list, 1-25. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await indicatorUrls(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof OtxError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
