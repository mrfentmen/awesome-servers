import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, recentUrls, lookupUrl, lookupPayload, searchTag, feedDigest, domainReputation } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "urlhaus-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "recent_urls",
    {
      title: "Recent URLs",
      description: "Recently added malicious URLs.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 1000).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await recentUrls(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "lookup_url",
    {
      title: "Lookup URL",
      description: "Check one URL against URLhaus.",
      inputSchema: z.object({
        url: z.string().describe("Full URL, e.g. http://example.com/malware.bin")
      }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        return text(await lookupUrl(url));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "lookup_payload",
    {
      title: "Lookup payload",
      description: "Malware payload details for one SHA256 hash.",
      inputSchema: z.object({
        sha256: z.string().describe("SHA256 hash.")
      }),
      annotations: READ_ONLY,
    },
    async ({ sha256 }) => {
      try {
        return text(await lookupPayload(sha256));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_tag",
    {
      title: "Search tag",
      description: "Malicious URLs carrying a malware tag, e.g. emotet.",
      inputSchema: z.object({
        tag: z.string().describe("Tag, e.g. emotet."),
        limit: z.string().describe("Max results.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ tag, limit }) => {
      try {
        return text(await searchTag(tag, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "feed_digest",
    {
      title: "Feed digest",
      description:
        "Reads abuse.ch's public recent-URLs dump as a whole: row count and date window, the payload types and URL statuses broken down, the most frequent hosts, tags and reporters, and the newest entries. Needs no Auth-Key.",
      inputSchema: z.object({
        limit: z.number().describe("Rows per breakdown, 1-40. Defaults to 12.").optional(),
        threat: z.string().describe("Optional threat filter, e.g. malware_download, exe_url.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: feed_digest ----
    const paywallMessage = await premiumRequired("feed_digest")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await feedDigest(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "domain_reputation",
    {
      title: "Domain reputation",
      description:
        "A domain's standing on abuse.ch's public DNS blocklist, queried the way a mail server would and decoded into a reason: spam domain, phishing, malware, botnet C2, and the rest of the published return codes. No Auth-Key and no API call.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to look up, e.g. example.com"),
        checkMx: z.boolean().describe("Unused; accepted so the schema matches the other lookup tools.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await domainReputation(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}