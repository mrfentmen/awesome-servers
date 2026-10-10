import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_domain, m0_ip, m1_domainInfo, asnInfo, asnNetworks, domainContacts } from './api.js'
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'whois-mcp', version: '1.0.0' })
server.registerTool(
    "domain",
    {
      title: "Domain",
      description: "Registration record for a domain.",
      inputSchema: z.object( { domain: z.string().describe("Domain like example.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_domain(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "ip",
    {
      title: "Ip",
      description: "Registration record for an IP address.",
      inputSchema: z.object( { ip: z.string().describe("IPv4 or IPv6 address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_ip(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "domain_info",
    {
      title: "Domain info",
      description: "Get registration info for a domain.",
      inputSchema: z.object( { domain: z.string().describe("Domain like example.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_domainInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "asn_info",
    {
      title: "ASN info",
      description: "An autonomous system's RDAP registration: name, handle, registration and last-change dates, and the entities responsible, which the domain and ip tools never reach.",
      inputSchema: z.object( { asn: z.union([z.string(), z.number()]).describe("AS number, e.g. 15169 or AS15169."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: asn_info ----
    const paywallMessage = await premiumRequired("asn_info")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await asnInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "asn_networks",
    {
      title: "ASN networks",
      description: "Every CIDR range a registered autonomous system announces, read from its RDAP record, which shows the real footprint behind an AS number.",
      inputSchema: z.object( { asn: z.union([z.string(), z.number()]).describe("AS number."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: asn_networks ----
    const paywallMessage = await premiumRequired("asn_networks")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await asnNetworks(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "domain_contacts",
    {
      title: "Domain contacts",
      description: "The public contact entities on a domain's RDAP record with roles, names, emails and phone numbers, which the domain summary view leaves out.",
      inputSchema: z.object( { domain: z.string().describe("Domain name, e.g. github.com."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: domain_contacts ----
    const paywallMessage = await premiumRequired("domain_contacts")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await domainContacts(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
