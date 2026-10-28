import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { connectedComponents, shortestPath, topologicalSort, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "graph-algorithms-mcp", version: "1.0.0" })

  server.tool(
    "shortest_path",
    "Find the cheapest path between two nodes with Dijkstra.",
    {
      edges: z.array(z.object({ from: z.string(), to: z.string(), weight: z.number().positive().optional() })).min(1).describe("Edges; weight defaults to 1"),
      from: z.string().describe("Start node"),
      to: z.string().describe("End node"),
      directed: z.boolean().default(false).describe("Treat edges as one-way")
    },
    async (a) => {
      try {
        return text(await shortestPath(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "topological_sort",
    "Order a directed acyclic graph so every edge points forward.",
    {
      edges: z.array(z.object({ from: z.string(), to: z.string() })).min(1).describe("Directed edges")
    },
    async (a) => {
      try {
        return text(await topologicalSort(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "connected_components",
    "Group nodes into connected components.",
    {
      edges: z.array(z.object({ from: z.string(), to: z.string() })).min(1).describe("Edges to analyse"),
      directed: z.boolean().default(false).describe("Follow edge direction")
    },
    async (a) => {
      try {
        return text(await connectedComponents(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
