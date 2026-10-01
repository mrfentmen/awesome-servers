import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getStatus, getStats, getQueryLog, filterRuleAudit, domainCoverage } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "adguardhome-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_status",
    {
      title: "Protection status",
      description: "DNS protection state: enabled, filters and upstreams.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getStatus());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_stats",
    {
      title: "Statistics",
      description: "Query and blocked-request counters, total and average.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getStats());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_query_log",
    {
      title: "Query log",
      description: "Recent DNS queries with client, domain and action.",
      inputSchema: z.object({
        limit: z.string().describe("Max entries (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await getQueryLog(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "filter_rule_audit",
    {
      title: "Filter rule audit",
      description: "What a published AdGuard filter list actually contains, read straight from the list with no AdGuard Home instance: its title, version and last-modified, the rule count against the comment count, a breakdown by AdGuard syntax (||domain^, hosts-file, regular expression, cosmetic ##selector, plain substring and @@ exceptions), the distinct domain count, the most used modifiers, and a note on what a DNS-only resolver ignores.",
      inputSchema: z.object({ url: z.string().describe("An https URL to a plain-text filter list. Defaults to the AdGuard DNS filter.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await filterRuleAudit(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "domain_coverage",
    {
      title: "Domain coverage",
      description: "Whether one domain is genuinely covered by a published AdGuard list, which is not the same as finding the string in the file: it checks the domain exactly, then every parent up to the registrable domain, because a rule for a parent also covers all subdomains, and it reports any @@ exception that would re-admit the domain.",
      inputSchema: z.object({
        domain: z.string().describe("The domain to check, e.g. ads.example.com."),
        url: z.string().describe("An https URL to a plain-text filter list. Defaults to the AdGuard DNS filter.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: domain_coverage ----
    const paywallMessage = await premiumRequired("domain_coverage")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await domainCoverage(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}