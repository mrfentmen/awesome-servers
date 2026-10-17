import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, dnsLookup, reverseDns, whoisLookup, geoIpLookup, httpHeaders, reverseIp } from "./api.js"
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "host_search",
    {
      title: "Host search",
      description: "Subdomain enumeration for a domain: every hostname that resolves, the address it points at, and which first labels repeat most.",
      inputSchema: z.object({ domain: z.string().describe("Domain to enumerate, e.g. stripe.com"), limit: z.number().int().min(1).max(200).default(25).describe("How many hostnames to print (default 25, max 200).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement search locally (paywall removed)
      try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "as_lookup",
    {
      title: "AS lookup",
      description: "BGP ownership of an address or autonomous system: the announcing AS, its registered holder, the covering prefix and how many prefixes it announces.",
      inputSchema: z.object({ query: z.string().describe("IP address or AS number, e.g. 8.8.8.8 or AS13335"), limit: z.number().int().min(1).max(100).default(15).describe("How many prefixes to print (default 15, max 100).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement lookup locally (paywall removed)
      try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
    }
  )

  return server
}