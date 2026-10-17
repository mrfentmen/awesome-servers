import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getStatus, getMetrics, httpProbe, releaseWatch } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "uptime-kuma-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_status",
    {
      title: "Instance status",
      description: "Up/down counts per monitor in one summary.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getStatus());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_metrics",
    {
      title: "Prometheus metrics",
      description: "Raw Prometheus metrics the instance exposes.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMetrics());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "http_probe",
    {
      title: "HTTP probe",
      description:
        "Measures a live URL the way a monitor does: name resolution, TLS handshake and certificate validity, then the request repeated so the median time to headers can be reported, with status, body size, redirect result and server headers. Needs no Uptime Kuma instance.",
      inputSchema: z.object({
        url: z.string().describe("URL to measure, e.g. https://example.com"),
        runs: z.number().describe("Attempts, 1-5. Defaults to 3.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await httpProbe(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "release_watch",
    {
      title: "Release watch",
      description:
        "What the Uptime Kuma project is doing: the current release and when it shipped, the releases before it with the average gap between them, repository activity, and the most recently updated open issues and pull requests with their labels. Reads the public project record.",
      inputSchema: z.object({
        releases: z.number().describe("Releases listed, 1-15. Defaults to 5.").optional(),
        issues: z.number().describe("Open items listed, 1-20. Defaults to 6.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await releaseWatch(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}