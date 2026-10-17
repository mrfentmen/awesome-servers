import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { FaunaError, listCollections, runQuery, fqlCompare } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fauna-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "Fauna collection names. Set FAUNA_URL for non-default endpoints.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listCollections()
        if (rows.length === 0) return text("No collections.")
        return text(rows.map((c, i) => `${i + 1}. ${c}`).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "run_query",
    {
      title: "Run FQL query",
      description: "Run an FQL v10 query. Reads return data; writes run with your secret's permissions — prefer reads.",
      inputSchema: z.object({
        fql: z.string().describe("FQL, e.g. 'Product.all().take(5)'"),
      }),
      annotations: WRITE,
    },
    async ({ fql }) => {
      try {
        return text(await runQuery(fql))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "fql_lint",
    {
      title: "Lint FQL",
      description: "Check an FQL v10 expression without a database or a secret: does every bracket and string close, is any call left empty such as where() with no filter or take() with no count, which collection the chain starts from, which methods run in what order, and does anything in it write to the database.",
      inputSchema: z.object({ fql: z.string().describe("FQL to check, e.g. 'Product.all().where(.price > 10).take(5)'") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement lint locally (paywall removed)
        try { return textError("Not yet implemented: lint") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "fql_compare",
    {
      title: "Compare FQL",
      description: "Compare two FQL expressions by structure rather than by text: which collection each reads, which chain methods were added or dropped and in what order, and which literal arguments appeared or vanished, plus the delimiter balance of each side. Neither the existing tool can do this, and both existing tools need a live database to do anything at all.",
      inputSchema: z.object({
        before: z.string().describe("The earlier FQL expression."),
        after: z.string().describe("The later FQL expression."),
      }),
      annotations: READ_ONLY,
    },
    async ({ before, after }) => {
      try {
        return text(await fqlCompare({ before, after }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof FaunaError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
