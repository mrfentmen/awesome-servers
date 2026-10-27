import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectScripts } from "./sherpa.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : "Script portability inspection failed"}`)
export function createServer() { const server = new McpServer({ name: "shebang-sherpa-mcp", version: "1.0.0" }); server.tool("inspect_script_portability", "Aggregate local script interpreter and launcher portability signals without returning paths, script text, project names, dependency names, or command arguments.", { project: z.string().min(1).max(1000).default(".").describe("Local project path; no commands from project files are executed.") }, async ({ project }) => { try { return text(format(await inspectScripts(project))) } catch (error) { return errorText(error) } }); return server }
