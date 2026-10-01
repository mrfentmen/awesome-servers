import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listAccounts, getAccount, listTransactions, fdicInstitutionSearch, fdicCallReportCompare } from "./api.js"
import { premiumRequired } from "./license.js"

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

  server.registerTool(
    "fdic_institution_search",
    {
      title: "FDIC institution search",
      description: "Search US banks by name in the FDIC's own BankFind data: certificate number, class of bank, headquarters, total assets, deposits, net income, ROA, ROE and the date the institution was established.",
      inputSchema: z.object({ name: z.string().describe("Bank name or fragment, e.g. 'JPMORGAN'."), limit: z.number().int().min(1).max(20).default(8).describe("Institutions to print (default 8, max 20)."), state: z.string().describe("Two-letter state code to narrow to, e.g. CA.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: fdic_institution_search ----
      const paywallMessage = await premiumRequired("fdic_institution_search")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await fdicInstitutionSearch(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "fdic_call_report_compare",
    {
      title: "FDIC call report compare",
      description: "Put up to six banks side by side from one quarter of FDIC call report data: assets, deposits, net income, equity, a computed loans-to-deposits ratio, ROA, ROE and net interest margin.",
      inputSchema: z.object({ certs: z.string().describe("FDIC certificate numbers, e.g. '628 3519'."), repdte: z.string().describe("Report date as YYYYMMDD (default 20260630).").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: fdic_call_report_compare ----
      const paywallMessage = await premiumRequired("fdic_call_report_compare")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await fdicCallReportCompare(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}