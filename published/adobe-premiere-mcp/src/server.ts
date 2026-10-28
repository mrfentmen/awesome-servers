// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as Premiere from "./premiere.js"

export function createServer(): McpServer {
  const server = new McpServer({ name: "adobe-premiere-mcp", version: "1.0.0" })

  server.tool("is_premiere_running", "Check if Adobe Premiere Pro is running.", {}, async () => {
    try {
      const running = await Premiere.isPremiereRunning()
      return { content: [{ type: "text", text: JSON.stringify({ running }, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("get_project_info", "Get information about the current Premiere Pro project.", {}, async () => {
    try {
      const info = await Premiere.getProjectInfo()
      return { content: [{ type: "text", text: info }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("list_sequences", "List all sequences in the current project.", {}, async () => {
    try {
      const seqs = await Premiere.listSequences()
      return { content: [{ type: "text", text: seqs }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("list_clips", "List all clips in the first sequence.", {}, async () => {
    try {
      const clips = await Premiere.listClips()
      return { content: [{ type: "text", text: clips }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool(
    "create_sequence",
    "Create a new sequence in the current project.",
    {
      name: z.string().describe("Sequence name"),
      width: z.number().min(1).max(10000).describe("Frame width in pixels"),
      height: z.number().min(1).max(10000).describe("Frame height in pixels"),
      frame_rate: z.number().min(1).max(120).optional().describe("Frame rate (default 30)"),
    },
    async (args: any) => {
      try {
        const result = await Premiere.createSequence(args.name, args.width, args.height, args.frame_rate ?? 30)
        return { content: [{ type: "text", text: result }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "import_media",
    "Import a media file into the current Premiere project.",
    {
      filepath: z.string().describe("Path to the media file to import"),
    },
    async (args: any) => {
      try {
        const result = await Premiere.importMedia(args.filepath)
        return { content: [{ type: "text", text: result }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_media_info",
    "Get metadata about a media file.",
    {
      filepath: z.string().describe("Path to the media file"),
    },
    async (args: any) => {
      try {
        const info = await Premiere.getMediaInfo(args.filepath)
        return { content: [{ type: "text", text: info }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool("get_sequence_info", "Get info about the current/active sequence.", {}, async () => {
    try {
      const info = await Premiere.getSelectedSequenceInfo()
      return { content: [{ type: "text", text: info }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool(
    "apply_effect",
    "Apply an effect to the first clip on the first video track.",
    {
      effect: z.string().describe("Effect name (e.g. 'GaussianBlur', 'BrightnessContrast')"),
      properties: z.string().optional().describe("JSON object with effect parameters"),
    },
    async (args: any) => {
      try {
        const props = args.properties ? JSON.parse(args.properties) : {}
        const result = await Premiere.applyEffect(args.effect, props)
        return { content: [{ type: "text", text: result }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "export_media",
    "Export the current sequence to a media file.",
    {
      output: z.string().describe("Output file path"),
      format: z.enum(["h264", "prores", "hevc", "mp4"]).describe("Export format"),
      preset: z.string().optional().describe("Export preset name"),
    },
    async (args: any) => {
      try {
        const result = await Premiere.exportMedia(args.output, args.format, args.preset)
        return { content: [{ type: "text", text: result }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "run_custom_script",
    "Run custom ExtendScript code in Adobe Premiere Pro.",
    {
      script: z.string().describe("ExtendScript (JavaScript) code to execute"),
    },
    async (args: any) => {
      try {
        const result = await Premiere.runCustomScript(args.script)
        return { content: [{ type: "text", text: result.stdout || result.stderr }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  return server
}
