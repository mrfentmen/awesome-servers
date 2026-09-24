import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listSafes,
  listAccounts,
  getAccount,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cyberark-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_safes",
    {
      title: "List safes",
      description: "CyberArk safes visible to the logon user.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listSafes());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_accounts",
    {
      title: "List accounts",
      description: "CyberArk accounts, optionally filtered by safe.",
      inputSchema: z.object({
        safeName: z.string().optional().describe("Safe name filter"),
      }),
      annotations: READ_ONLY,
    },
    async ({ safeName }) => {
      try {
        return text(await listAccounts(safeName));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_account",
    {
      title: "Get account",
      description: "One CyberArk account by id (metadata, not the password value).",
      inputSchema: z.object({
        accountId: z.string().describe("Account id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accountId }) => {
      try {
        return text(await getAccount(accountId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
