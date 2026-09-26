import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  dnsLookup,
  reverseDns,
  whoisLookup,
  geoIpLookup,
  httpHeaders,
  reverseIp,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hackertarget-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "dns_lookup",
    {
      title: "DNS lookup",
      description: "A/AAAA/MX/NS records for a domain. Keyless.",
      inputSchema: z.object({
        domain: z.string().describe("Domain, e.g. example.com.")
      }),
      annotations: READ_ONLY,
    },
    async ({ domain }) => {
      try {
        return text(await dnsLookup(domain));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "reverse_dns",
    {
      title: "Reverse DNS",
      description: "PTR records for an IP address.",
      inputSchema: z.object({
        ip: z.string().describe("IPv4/IPv6 address.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ip }) => {
      try {
        return text(await reverseDns(ip));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "whois_lookup",
    {
      title: "Whois",
      description: "WHOIS record for a domain or IP.",
      inputSchema: z.object({
        query: z.string().describe("Domain or IP.")
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await whoisLookup(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "geoip_lookup",
    {
      title: "GeoIP",
      description: "Country/region/city for IP or domain.",
      inputSchema: z.object({
        query: z.string().describe("IP or domain.")
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await geoIpLookup(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "http_headers",
    {
      title: "HTTP headers",
      description: "Response headers for a URL, with status code.",
      inputSchema: z.object({
        url: z.string().describe("Full URL, e.g. https://example.com")
      }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        return text(await httpHeaders(url));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "reverse_ip",
    {
      title: "Reverse IP",
      description: "Domains and hostnames hosted on one IP address.",
      inputSchema: z.object({
        ip: z.string().describe("IPv4 address.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ip }) => {
      try {
        return text(await reverseIp(ip));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}