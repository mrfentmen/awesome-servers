import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectConfigWeather, inspectEnvContract, inspectConfigLayers } from "./core.js"
import { premiumRequired } from "./license.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "config-weather-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_config_weather",
    {
      title: "Inspect config weather",
      description: "Measure local configuration complexity and environment contract pressure without returning values, keys, paths, or source.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => { try { return text(format(await inspectConfigWeather(input))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "inspect_env_contract",
    {
      title: "Inspect env contract",
      description: "Compare the environment keys a project references against the keys its .env files define, reporting what is referenced but never defined, what is defined but never used, and keys defined in more than one file.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => {
    // ---- paywall: inspect_env_contract ----
    const paywallMessage = await premiumRequired("inspect_env_contract")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(format(await inspectEnvContract(input))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "inspect_config_layers",
    {
      title: "Inspect config layers",
      description: "Group a project's configuration files by the environment layer their path implies, such as production, staging, development, test or container, with line counts and files that match more than one layer.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => {
    // ---- paywall: inspect_config_layers ----
    const paywallMessage = await premiumRequired("inspect_config_layers")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(format(await inspectConfigLayers(input))) } catch (error) { return errorText(error) }
  }
  )
  return server
}
