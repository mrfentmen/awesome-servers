import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { issuances, transparencyLog } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "certspotter-mcp", version: "1.0.0" })
  server.registerTool(
    "issuances",
    {
      title: "Issuances",
      description: "Certificate issuances for a domain.",
      inputSchema: z.object( { domain: z.string().describe("Domain name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await issuances(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "subdomain_certificates",
    {
      title: "Subdomain certificates",
      description: "Certificates that cover a domain or any of its subdomains, listing every host name seen.",
      inputSchema: z.object( { domain: z.string().describe("Domain name."), limit: z.number().describe("Max certificates.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement certificates locally (paywall removed)
    try { return textError("Not yet implemented: certificates") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "issuance_issuers",
    {
      title: "Issuance issuers",
      description: "Which certificate authorities issued a domain's certificates, with validity windows and revocation.",
      inputSchema: z.object( { domain: z.string().describe("Domain name."), limit: z.number().describe("Max certificates.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement issuers locally (paywall removed)
    try { return textError("Not yet implemented: issuers") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "transparency_log",
    {
      title: "Transparency log",
      description: "Unexpired certificate transparency log entries for a domain, straight from crt.sh.",
      inputSchema: z.object( { domain: z.string().describe("Domain name."), limit: z.number().describe("Max entries.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await transparencyLog(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
