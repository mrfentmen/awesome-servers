import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectConfigWeather } from "./core.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "config-weather-mcp", version: "1.0.0" })
  server.tool("inspect_config_weather", "Measure local configuration complexity and environment contract pressure without returning values, keys, paths, or source.", { project: z.string().min(1).max(1000).default(".") }, async (input) => { try { return text(format(await inspectConfigWeather(input))) } catch (error) { return errorText(error) } })
  return server
}
