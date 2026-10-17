import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { model, models, creatorModels } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "civitai-mcp", version: "1.0.0" })
  server.registerTool(
    "models",
    {
      title: "Models",
      description: "Public Civitai models.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional(), query: z.string().describe("Search terms.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await models(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "model",
    {
      title: "Model",
      description: "Details for one model.",
      inputSchema: z.object( { id: z.number().describe("Model ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await model(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "model_version",
    {
      title: "Model version",
      description: "One released model version in full: its base model, trigger words, stats, every downloadable file with its size, sha256 and virus and pickle scan results, and the generation settings behind the example images, seed by seed. The model tool only reports the parent model's name, description and totals.",
      inputSchema: z.object( { version_id: z.number().describe("Model version ID, like 290640. The models tool's rows carry these under versions.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement version locally (paywall removed)
    try { return textError("Not yet implemented: version") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "creator_models",
    {
      title: "Creator models",
      description: "Everything one Civitai creator has published: each model with its type, downloads, thumbs up, version count, base models and tags, plus the total downloads across the models shown. The models tool searches by text only and cannot filter to a creator.",
      inputSchema: z.object( { username: z.string().describe("Civitai username, like JustMaier."), limit: z.number().describe("Max models, 1 to 30.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await creatorModels(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
