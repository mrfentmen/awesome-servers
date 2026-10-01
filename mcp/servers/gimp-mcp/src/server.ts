// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as Gimp from "./gimp.js"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "gimp-mcp", version: "1.0.0" })

  server.registerTool(
    "open_image",
    {
      title: "Open image",
      description: "Open an image file in GIMP.",
      inputSchema: z.object(
    {
      filepath: z.string().describe("Path to the image file to open"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const result = await Gimp.openImage(args.filepath)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "save_image",
    {
      title: "Save image",
      description: "Save the current image to a file.",
      inputSchema: z.object(
    {
      filepath: z.string().describe("Path to the source image"),
      output: z.string().optional().describe("Output path (defaults to source path)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const result = await Gimp.saveImage(args.filepath, args.output)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "export_image",
    {
      title: "Export image",
      description: "Export an image to a specific format.",
      inputSchema: z.object(
    {
      filepath: z.string().describe("Path to the source image"),
      output: z.string().describe("Output file path"),
      format: z.enum(["png", "jpg", "jpeg", "xcf", "psd"]).optional().describe("Export format (default: png)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const result = await Gimp.exportImage(args.filepath, args.output, args.format ?? "png")
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "resize_image",
    {
      title: "Resize image",
      description: "Resize an image to specific dimensions.",
      inputSchema: z.object(
    {
      filepath: z.string().describe("Path to the source image"),
      width: z.number().min(1).max(100000).describe("New width in pixels"),
      height: z.number().min(1).max(100000).describe("New height in pixels"),
      output: z.string().optional().describe("Output path (defaults to source path)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const result = await Gimp.resizeImage(args.filepath, args.width, args.height, args.output)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_image_info",
    {
      title: "Get image info",
      description: "Get information about an image (dimensions, mode, type, layers).",
      inputSchema: z.object(
    {
      filepath: z.string().describe("Path to the image file"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const info = await Gimp.getImageInfo(args.filepath)
        return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "list_layers",
    {
      title: "List layers",
      description: "List all layers in an image.",
      inputSchema: z.object(
    {
      filepath: z.string().describe("Path to the image file"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const layers = await Gimp.listLayers(args.filepath)
        return { content: [{ type: "text", text: JSON.stringify(layers, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "apply_filter",
    {
      title: "Apply filter",
      description: "Apply a filter to an image.",
      inputSchema: z.object(
    {
      filepath: z.string().describe("Path to the source image"),
      filter: z.enum(["blur", "sharpen", "brightness-contrast", "grayscale"]).describe("Filter type"),
      params: z.string().optional().describe("JSON object with filter parameters"),
      output: z.string().optional().describe("Output path (defaults to source path)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const params = args.params ? JSON.parse(args.params) : {}
        const result = await Gimp.applyFilter(args.filepath, args.filter, params, args.output)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "batch_process",
    {
      title: "Batch process",
      description: "Batch process multiple images with custom Script-Fu/Python-Fu code.",
      inputSchema: z.object(
    {
      pattern: z.string().describe("Glob pattern for files (e.g. /images/*.png)"),
      script: z.string().describe("Python code that runs per image (image and drawable are available)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const result = await Gimp.batchProcess(args.pattern, args.script)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  return server
}
