import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compare, details, errorMessage, financialSummary, formatDetails, formatSearch, search, searchByCategory, searchByState, searchBySubsection, filings } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const PAGE = z.number().int().min(0).max(99).default(0).describe("Page of results (0 is the first)")

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nonprofit-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search",
    {
      title: "Search nonprofits",
      description:
        "Search US nonprofits by name. Returns EIN, location and NTEE code for each match.",
      inputSchema: z.object({
        query: z.string().describe("Organisation name, e.g. 'Red Cross'"),
        page: PAGE,
      }),
      annotations: READ_ONLY,
    },
    async ({ query, page }) => {
      try {
        return text(formatSearch(await search(query, page), `Nonprofits matching "${query}"`))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "search_by_state",
    {
      title: "Nonprofits by state",
      description: "List nonprofits registered in a US state.",
      inputSchema: z.object({
        state: z.string().describe("Two-letter state code, e.g. 'CA'"),
        page: PAGE,
      }),
      annotations: READ_ONLY,
    },
    async ({ state, page }) => {
      try {
        return text(formatSearch(await searchByState(state, page), `Nonprofits in ${state.toUpperCase()}`))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "search_by_category",
    {
      title: "Nonprofits by NTEE category",
      description:
        "Find nonprofits by NTEE category, optionally within one state. Accepts the NTEE letter " +
        "(A arts, B education, C environment, E health, P human services, S community) or a full code like 'B20'.",
      inputSchema: z.object({
        ntee_code: z.string().describe("NTEE letter or code, e.g. 'E', 'B20', or the number 1-26"),
        state: z.string().describe("Optional two-letter state code").optional(),
        page: PAGE,
      }),
      annotations: READ_ONLY,
    },
    async ({ ntee_code, state, page }) => {
      try {
        const label = `Nonprofits with NTEE ${ntee_code.toUpperCase()}${state ? ` in ${state.toUpperCase()}` : ""}`
        return text(formatSearch(await searchByCategory(ntee_code, state, page), label))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "details",
    {
      title: "Organisation details",
      description:
        "Full profile for one EIN: address, ruling date, latest revenue and expenses, and a link to the newest Form 990.",
      inputSchema: z.object({
        ein: z.string().describe("9-digit EIN from a search, e.g. '530196605'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ ein }) => {
      try {
        return text(formatDetails(await details(ein)))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "financial_summary",
    {
      title: "Financial history",
      description:
        "Revenue, expenses and net result year by year for one EIN, with the change over the period.",
      inputSchema: z.object({
        ein: z.string().describe("9-digit EIN, e.g. '530196605'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ ein }) => {
      try {
        return text(financialSummary(await details(ein)))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "compare",
    {
      title: "Compare nonprofits",
      description: "Put up to 5 nonprofits side by side: location, category, revenue and expenses.",
      inputSchema: z.object({
        eins: z.string().describe("Comma-separated EINs, e.g. '530196605, 131624028'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ eins }) => {
      try {
        return text(await compare(eins.split(",")))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "search_by_subsection",
    {
      title: "Search by subsection",
      description: "Nonprofits by IRS subsection: 501(c)(3), (c)(4), (c)(6) and the rest, optionally within one state.",
      inputSchema: z.object({
        subsection: z.string().describe("3, 4, 6, 19 or 501(c)(3)."),
        state: z.string().describe("Optional two-letter state code.").optional(),
        page: z.number().describe("Page number, 0-based (default 0).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await searchBySubsection(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "filings",
    {
      title: "Filing history",
      description: "Every Form 990 on record for one EIN: year, form type, revenue, expenses, assets and the PDF links.",
      inputSchema: z.object({
        ein: z.string().describe("Nine-digit EIN, e.g. 562618866."),
        limit: z.number().describe("Filings to list (default 10, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await filings(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "state_sector_census",
    {
      title: "State sector census",
      description: "How a state's registered nonprofits are distributed across the NTEE activity codes they file under: organisation count and share per code, how many cities each code covers, example names, the subdivisions carrying the most, and the median search relevance score.",
      inputSchema: z.object({ state: z.string().describe("Two-letter state code, e.g. NY."), limit: z.number().int().min(1).max(40).default(12).describe("Codes to print (default 12, max 40)."), pages: z.number().int().min(1).max(5).default(2).describe("Result pages to read (default 2, max 5).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement census locally (paywall removed)
      try { return textError("Not yet implemented: census") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "filing_recency_audit",
    {
      title: "Filing recency audit",
      description: "How current the filings behind a set of EINs are: the newest return and how many months old it is, the revenue, expenses and assets it reported, how many returns exist in total, and which organisations have not filed in over 18 months or have no dated filing at all.",
      inputSchema: z.object({ eins: z.string().describe("Up to twelve EINs, e.g. '131660611 131632409'."), limit: z.number().int().min(1).max(12).default(6).describe("Rows to print (default 6, max 12).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement audit locally (paywall removed)
      try { return textError("Not yet implemented: audit") } catch (e) { return textError(String(e)) }
    }
  )

  return server
}
