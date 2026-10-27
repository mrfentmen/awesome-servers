import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listAccounts,
  getAccount,
  listTransactions,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mercury-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_accounts",
    {
      title: "List accounts",
      description: "Mercury accounts with balance and type.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listAccounts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_account",
    {
      title: "Get account",
      description: "One account by id, with routing details.",
      inputSchema: z.object({
        account_id: z.string().describe("Mercury account ID, e.g. 123456789")
      }),
      annotations: READ_ONLY,
    },
    async ({ account_id }) => {
      try {
        return text(await getAccount(account_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_transactions",
    {
      title: "List transactions",
      description: "Transactions on an account, newest first.",
      inputSchema: z.object({
        account_id: z.string().describe("Mercury account ID, e.g. 123456789"),
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ account_id, limit }) => {
      try {
        return text(await listTransactions(account_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}