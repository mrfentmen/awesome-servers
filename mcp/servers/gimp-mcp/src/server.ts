// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as Gimp from "./gimp.js"

export function createServer(): McpServer {
  const server = new McpServer({ name: "gimp-mcp", version: "1.0.0" })

  server.tool(
    "open_image",
    "Open an image file in GIMP.",
    {
      filepath: z.string().describe("Path to the image file to open"),
    },
    async (args: any) => {
      try {
        const result = await Gimp.openImage(args.filepath)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "save_image",
    "Save the current image to a file.",
    {
      filepath: z.string().describe("Path to the source image"),
      output: z.string().optional().describe("Output path (defaults to source path)"),
    },
    async (args: any) => {
      try {
        const result = await Gimp.saveImage(args.filepath, args.output)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "export_image",
    "Export an image to a specific format.",
    {
      filepath: z.string().describe("Path to the source image"),
      output: z.string().describe("Output file path"),
      format: z.enum(["png", "jpg", "jpeg", "xcf", "psd"]).optional().describe("Export format (default: png)"),
    },
    async (args: any) => {
      try {
        const result = await Gimp.exportImage(args.filepath, args.output, args.format ?? "png")
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "resize_image",
    "Resize an image to specific dimensions.",
    {
      filepath: z.string().describe("Path to the source image"),
      width: z.number().min(1).max(100000).describe("New width in pixels"),
      height: z.number().min(1).max(100000).describe("New height in pixels"),
      output: z.string().optional().describe("Output path (defaults to source path)"),
    },
    async (args: any) => {
      try {
        const result = await Gimp.resizeImage(args.filepath, args.width, args.height, args.output)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_image_info",
    "Get information about an image (dimensions, mode, type, layers).",
    {
      filepath: z.string().describe("Path to the image file"),
    },
    async (args: any) => {
      try {
        const info = await Gimp.getImageInfo(args.filepath)
        return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "list_layers",
    "List all layers in an image.",
    {
      filepath: z.string().describe("Path to the image file"),
    },
    async (args: any) => {
      try {
        const layers = await Gimp.listLayers(args.filepath)
        return { content: [{ type: "text", text: JSON.stringify(layers, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "apply_filter",
    "Apply a filter to an image.",
    {
      filepath: z.string().describe("Path to the source image"),
      filter: z.enum(["blur", "sharpen", "brightness-contrast", "grayscale"]).describe("Filter type"),
      params: z.string().optional().describe("JSON object with filter parameters"),
      output: z.string().optional().describe("Output path (defaults to source path)"),
    },
    async (args: any) => {
      try {
        const params = args.params ? JSON.parse(args.params) : {}
        const result = await Gimp.applyFilter(args.filepath, args.filter, params, args.output)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "batch_process",
    "Batch process multiple images with custom Script-Fu/Python-Fu code.",
    {
      pattern: z.string().describe("Glob pattern for files (e.g. /images/*.png)"),
      script: z.string().describe("Python code that runs per image (image and drawable are available)"),
    },
    async (args: any) => {
      try {
        const result = await Gimp.batchProcess(args.pattern, args.script)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  return server
}
