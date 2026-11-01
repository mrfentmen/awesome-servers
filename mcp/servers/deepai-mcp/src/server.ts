import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { callModel, DeepAiError, formatResult } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const url = (what: string) =>
  z.string().describe(`${what}. Must be a public http(s) URL — DeepAI fetches it, local files will not work.`)

export function createServer(): McpServer {
  const server = new McpServer({
    name: "deepai-mcp",
    version: "1.0.0",
  })

  server.tool(
    "text_to_image",
    "Generate an image from a text prompt with DeepAI text2img. Returns an output URL.",
    { text: z.string().describe("Prompt describing the image to generate") },
    async ({ text: prompt }) => run("text2img", { text: prompt })
  )

  server.tool(
    "image_to_image",
    "Transform an existing image with a text prompt (DeepAI img2img).",
    {
      image: url("Source image"),
      text: z.string().describe("Prompt describing the desired change"),
    },
    async ({ image, text: prompt }) => run("img2img", { image, text: prompt })
  )

  server.tool(
    "style_transfer",
    "Apply the style of one image to the content of another (neural style transfer).",
    {
      content: url("Content image"),
      style: url("Style image"),
    },
    async ({ content, style }) => run("neural-style-transfer", { content, style })
  )

  server.tool(
    "super_resolution",
    "Upscale and sharpen an image with DeepAI super resolution.",
    { image: url("Image to upscale") },
    async ({ image }) => run("super-resolution", { image })
  )

  server.tool(
    "colorize",
    "Colorize a black and white photograph.",
    { image: url("Grayscale image") },
    async ({ image }) => run("colorizer", { image })
  )

  server.tool(
    "remove_background",
    "Remove the background from an image and return a cut-out.",
    { image: url("Image with a background to remove") },
    async ({ image }) => run("background-remover", { image })
  )

  server.tool(
    "deepdream",
    "Apply DeepDream hallucination effects to an image.",
    { image: url("Image to dream on") },
    async ({ image }) => run("deepdream", { image })
  )

  server.tool(
    "analyze_sentiment",
    "Classify the sentiment of a passage of text.",
    { text: z.string().describe("Text to analyze") },
    async ({ text: input }) => run("sentiment-analysis", { text: input })
  )

  server.tool(
    "summarize_text",
    "Summarise a long piece of text into a short abstract.",
    { text: z.string().describe("Text to summarise") },
    async ({ text: input }) => run("summarize", { text: input })
  )

  server.tool(
    "generate_tags",
    "Extract topic tags from a piece of text.",
    { text: z.string().describe("Text to tag") },
    async ({ text: input }) => run("text-tagging", { text: input })
  )

  async function run(model: string, params: Record<string, string | undefined>) {
    try {
      const result = await callModel(model, params)
      return text(formatResult(result))
    } catch (e) {
      return fail(errorMessage(e))
    }
  }

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DeepAiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
