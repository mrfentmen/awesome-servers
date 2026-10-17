import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getServer, listTemplates, listOutbound, blacklistCheck, mailPolicyReport } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "postmark-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_server",
    {
      title: "Server info",
      description: "Postmark server details and delivery settings.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getServer());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_templates",
    {
      title: "List templates",
      description: "Email templates on the server, with ids.",
      inputSchema: z.object({
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await listTemplates(count));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_outbound",
    {
      title: "Outbound messages",
      description: "Recent outbound messages with recipient and status.",
      inputSchema: z.object({
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await listOutbound(count));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "blacklist_check",
    {
      title: "Sending IP blocklist check",
      description:
        "Whether the mail servers a domain sends from appear on any public DNS blocklist (Spamhaus ZEN, SpamCop, Barracuda, SORBS), with the PTR name of each address.",
      inputSchema: z.object({
        email: z.string().describe("Sending address or domain, e.g. 'bounce@shop.example.com' or 'example.com'"),
        limit: z.number().describe("Max addresses to query, 1-40. Defaults to 12.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await blacklistCheck(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "mail_policy_report",
    {
      title: "Mail transport policy",
      description:
        "Whether a sending domain publishes MTA-STS (and in what mode), a BIMI record for brand display, and a TLS-RPT record for failed handshakes, with the policy's authorised MX hosts.",
      inputSchema: z.object({
        domain: z.string().describe("Sending domain, e.g. 'google.com'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mailPolicyReport(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}