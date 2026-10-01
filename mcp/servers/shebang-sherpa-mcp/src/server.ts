import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectScripts } from "./sherpa.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : "Script portability inspection failed"}`)
export function createServer() { const server = new McpServer({ name: "shebang-sherpa-mcp", version: "1.0.0" }); server.registerTool(
    "inspect_script_portability",
    {
      title: "Inspect script portability",
      description: "Aggregate local script interpreter and launcher portability signals without returning paths, script text, project names, dependency names, or command arguments.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".").describe("Local project path; no commands from project files are executed.") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => { try { return text(format(await inspectScripts(project))) } catch (error) { return errorText(error) } }
  ); return server }
