import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { model, models } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "huggingface-mcp", version: "1.0.0" })
  server.registerTool(
    "models",
    {
      title: "Models",
      description: "Public Hugging Face models.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional(), query: z.string().describe("Search terms.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await models(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "model",
    {
      title: "Model",
      description: "Details for one model.",
      inputSchema: z.object( { name: z.string().describe("Model id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await model(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "datasets",
    {
      title: "Datasets",
      description: "Search the datasets on the Hugging Face Hub, with likes, downloads, update date and whether a dataset is gated.",
      inputSchema: z.object( { search: z.string().describe("Search term.").optional(), author: z.string().describe("Owner, e.g. facebook.").optional(), limit: z.number().describe("Max datasets.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: datasets ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_huggingface_datasets", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "spaces",
    {
      title: "Spaces",
      description: "Search the Gradio, static and Docker Spaces on the Hugging Face Hub, with the runtime each Space declares.",
      inputSchema: z.object( { search: z.string().describe("Search term."), sdk: z.string().describe("gradio, static, docker or streamlit.").optional(), limit: z.number().describe("Max Spaces.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: spaces ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_huggingface_spaces", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "space_detail",
    {
      title: "Space detail",
      description: "One Hugging Face Space's full record: runtime stage, requested hardware, tags and commit sha.",
      inputSchema: z.object( { space: z.string().describe("Space id as owner/name."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: space_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_huggingface_space_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
