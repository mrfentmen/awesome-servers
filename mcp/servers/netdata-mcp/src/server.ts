import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getInfo, listCharts, getData, netdataReleaseCensus, netdataPlatformAudit } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "netdata-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_info",
    {
      title: "Node info",
      description: "Agent version, OS, collectors.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getInfo());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_charts",
    {
      title: "List charts",
      description: "Charts exposed by the Netdata agent.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCharts());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_data",
    {
      title: "Chart data",
      description: "Recent data points for a chart.",
      inputSchema: z.object({
        chart: z.string().describe("Chart ID, e.g. system.cpu."),
        points: z.string().describe("Points (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ chart, points }) => {
      try {
        return text(await getData(chart, points));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "netdata_release_census",
    {
      title: "Netdata release census",
      description: "What Netdata is publishing right now, read from Docker Hub: the most recently pushed tags, how fresh each one is, the size of the image, how many tags landed on each day, and the smallest, largest and median size in the set.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(12).describe("Tags to print (default 12, max 30)."), pageSize: z.number().int().min(10).max(100).default(50).describe("Tags to fetch (default 50, max 100).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await netdataReleaseCensus(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "netdata_platform_audit",
    {
      title: "Netdata platform audit",
      description: "Which platforms a Netdata container tag actually serves, read from the public registry manifest index: every os/architecture pair, and how many manifest entries are provenance attestations rather than images.",
      inputSchema: z.object({ tag: z.string().describe("Image tag to inspect (default latest).").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await netdataPlatformAudit(args)) } catch (e) { return textError(String(e)) }
    }
  )

  return server
}