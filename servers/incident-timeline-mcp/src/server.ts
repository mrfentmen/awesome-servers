import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, summarizeIncidentTimeline } from "./core.js"
import { classifyLogLine } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "incident-timeline-mcp", version: "1.0.0" })
  server.registerTool(
    "summarize_incident_timeline",
    {
      title: "Summarize incident timeline",
      description: "Summarize local log timeline gaps and severity counts without returning messages, IDs, paths, or IP addresses.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => { try { return text(format(await summarizeIncidentTimeline(input))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "profile_incident_samples",
    {
      title: "Profile incident samples",
      description: "Compute a burst and inter-arrival profile over log text you supply: severity mix, timestamp coverage, relative-time bucket histogram, largest gap, burst ratio and an incident shape. Purely local, nothing is echoed back.",
      inputSchema: z.object( { samples: z.string().describe("Log text to profile, up to 200,000 characters."), bucket_seconds: z.number().int().min(5).max(3600).optional().describe("Histogram bucket width in seconds, 5-3600, default 60.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: profile_incident_samples ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_incident_timeline_profile_incident_samples", args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "classify_log_line",
    {
      title: "Classify log line",
      description: "Classify one log line you supply into a severity level, signal presence flags and a 0-10 severity score. The line text is never echoed back.",
      inputSchema: z.object( { line: z.string().describe("A single log line, up to 20,000 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await classifyLogLine(args)) } catch (error) { return errorText(error) }
  }
  )

  return server
}
