import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getHost, searchHosts, hostAggregate, searchCertificates, certificateExposure } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "censys-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_host",
    {
      title: "Host lookup",
      description: "Censys record for an IP: services, ports and certificates.",
      inputSchema: z.object({
        ip: z.string().describe("IPv4/IPv6 address.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ip }) => {
      try {
        return text(await getHost(ip));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "search_hosts",
    {
      title: "Search hosts",
      description: "Search hosts with Censys query syntax, e.g. services.http.",
      inputSchema: z.object({
        query: z.string().describe("e.g. services.service_name: HTTP."),
        per_page: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, per_page }) => {
      try {
        return text(await searchHosts(query, per_page));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "host_aggregate",
    {
      title: "Host aggregate",
      description: "Bucket any Censys host field across every host matching a query - top ports on HTTP, ASNs in a country, software in use - with total, omitted hosts and deviation.",
      inputSchema: z.object({
        field: z.string().describe("Censys field path, e.g. services.port or autonomous_system.asn"),
        query: z.string().describe("Censys query, e.g. services.service_name: HTTP"),
        buckets: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hostAggregate(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search_certificates",
    {
      title: "Search certificates",
      description: "Search the Censys certificate index: subject, issuer, signature algorithm, validity window and days remaining, SAN names, JA3/JA4 and NSS validation status.",
      inputSchema: z.object({
        query: z.string().describe("Censys certificate query, e.g. names: example.com"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchCertificates(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "certificate_exposure",
    {
      title: "Certificate exposure",
      description: "The exposure surface behind one certificate: its subject, issuer, validity and names, then every Censys host presenting it with the services and ports it appears on.",
      inputSchema: z.object({
        fingerprint: z.string().describe("SHA-256 certificate fingerprint, 64 hex characters, colons allowed"),
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await certificateExposure(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}