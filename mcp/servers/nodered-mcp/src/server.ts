import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatFlow, getFlow, listFlows, NodeRedError, flowGraphAudit, wiringReport, flowLint } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nodered-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_flows",
    {
      title: "List flows",
      description: "Node-RED flow tabs with ids and labels. Set NODERED_URL for non-default hosts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listFlows()
        if (rows.length === 0) return text("No flows.")
        return text(rows.map((f, i) => `${i + 1}. [${f.id}] ${f.label ?? "(unnamed)"}${f.disabled ? " (disabled)" : ""}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_flow",
    {
      title: "Get flow",
      description: "One flow: node count plus node-type breakdown.",
      inputSchema: z.object({
        id: z.string().describe("Flow tab id (use list_flows)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatFlow(id, await getFlow(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "flow_graph_audit",
    {
      title: "Flow graph audit",
      description: "Audit the shape of a Node-RED flow you supply as JSON: node type breakdown, nodes per tab, how many are disabled, wire volume per node, how much inline function, subflow and template code it carries, how many nodes have an info comment, and the layout bounding box. Code is measured by length only, never printed.",
      inputSchema: z.object({ flow: z.string().describe("The flow as the JSON array Node-RED exports, up to 4 MB.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await flowGraphAudit(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "wiring_report",
    {
      title: "Wiring report",
      description: "Trace the wiring topology of a Node-RED flow you supply as JSON: the wire count, the nodes with no inbound wire and the nodes with no outbound wire, the longest chain from a source to a sink, where fan-out and fan-in concentrate, and any wire pointing at a node id the flow does not contain.",
      inputSchema: z.object({ flow: z.string().describe("The flow as the JSON array Node-RED exports."), limit: z.number().describe("Entries to list per section, 1-25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await wiringReport(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "flow_lint",
    {
      title: "Flow lint",
      description: "Static lint of a Node-RED flow before deploy: duplicate node ids, nodes with no type, function nodes with an empty body, wires naming an id the flow does not contain, nodes wired to nothing in either direction, unnamed function nodes, and comments with no text.",
      inputSchema: z.object({ flow: z.string().describe("The flow as the JSON array Node-RED exports.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await flowLint(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof NodeRedError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
