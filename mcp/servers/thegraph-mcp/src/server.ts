import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  querySubgraph,
  getSubgraphSchema,
  getLatestBlock,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "thegraph-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "query_subgraph",
    {
      title: "Query a subgraph",
      description: "Run GraphQL against a subgraph on The Graph decentralized network. Example query: '{ _meta { block { number } } }'. Variables as JSON string.",
      inputSchema: z.object({
        subgraphId: z.string().describe("Subgraph id, e.g. the Uniswap v3 id"),
        query: z.string().describe("GraphQL query"),
        variables: z.string().optional().describe("Variables as JSON object string"),
      }),
      annotations: READ_ONLY,
    },
    async ({ subgraphId, query, variables }) => {
      try {
        return text(await querySubgraph(subgraphId, query, variables));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_subgraph_schema",
    {
      title: "Get subgraph schema",
      description: "Fetch the GraphQL schema of a subgraph via introspection: entities and fields you can query.",
      inputSchema: z.object({
        subgraphId: z.string().describe("Subgraph id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ subgraphId }) => {
      try {
        return text(await getSubgraphSchema(subgraphId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_latest_block",
    {
      title: "Get indexed block",
      description: "Latest block a subgraph has indexed: chain, number, hash, timestamp.",
      inputSchema: z.object({
        subgraphId: z.string().describe("Subgraph id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ subgraphId }) => {
      try {
        return text(await getLatestBlock(subgraphId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
