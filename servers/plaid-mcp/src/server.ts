import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listInstitutions,
  listCategories,
  sandboxToken,
  getInstitution,
  sandboxBalance,
  sandboxTransactions,
  sandboxHoldings,
  sandboxLiabilities,
  sandboxAuth,
  sandboxIdentity,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "plaid-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_institutions",
    {
      title: "List institutions",
      description: "Sandbox banks available for testing.",
      inputSchema: z.object({
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await listInstitutions(count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "Personal finance categories Plaid can return.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCategories());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "sandbox_token",
    {
      title: "Sandbox token",
      description: "Create a test public token (sandbox only).",
      inputSchema: z.object({
        institution_id: z.string().describe("Institution ID (default ins_109508).").optional()
      }),
      annotations: MUTATING,
    },
    async ({ institution_id }) => {
      try {
        return text(await sandboxToken(institution_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_institution",
    {
      title: "Institution details",
      description: "By ID.",
      inputSchema: z.object({
        institution_id: z.string().describe("Institution ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ institution_id }) => {
      try {
        return text(await getInstitution(institution_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "sandbox_balance",
    {
      title: "Account balances",
      description: "Needs sandbox access token.",
      inputSchema: z.object({
        access_token: z.string().describe("Sandbox access token.")
      }),
      annotations: READ_ONLY,
    },
    async ({ access_token }) => {
      try {
        return text(await sandboxBalance(access_token));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "sandbox_transactions",
    {
      title: "Transactions sync",
      description: "Needs sandbox access token.",
      inputSchema: z.object({
        access_token: z.string().describe("Sandbox access token."),
        days: z.string().describe("Lookback days (default 30, max 730).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ access_token, days }) => {
      try {
        return text(await sandboxTransactions(access_token, days));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "sandbox_holdings",
    {
      title: "Holdings",
      description: "Investment holdings.",
      inputSchema: z.object({
        access_token: z.string().describe("Sandbox access token.")
      }),
      annotations: READ_ONLY,
    },
    async ({ access_token }) => {
      try {
        return text(await sandboxHoldings(access_token));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "sandbox_liabilities",
    {
      title: "Liabilities",
      description: "Loans/credit.",
      inputSchema: z.object({
        access_token: z.string().describe("Sandbox access token.")
      }),
      annotations: READ_ONLY,
    },
    async ({ access_token }) => {
      try {
        return text(await sandboxLiabilities(access_token));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "sandbox_auth",
    {
      title: "Auth numbers",
      description: "Account/routing.",
      inputSchema: z.object({
        access_token: z.string().describe("Sandbox access token.")
      }),
      annotations: READ_ONLY,
    },
    async ({ access_token }) => {
      try {
        return text(await sandboxAuth(access_token));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "sandbox_identity",
    {
      title: "Identity",
      description: "Account holder.",
      inputSchema: z.object({
        access_token: z.string().describe("Sandbox access token.")
      }),
      annotations: READ_ONLY,
    },
    async ({ access_token }) => {
      try {
        return text(await sandboxIdentity(access_token));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}