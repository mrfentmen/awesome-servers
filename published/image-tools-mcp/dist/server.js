import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { inspectImage } from "./api.js";
import { resizeImage, probeUrl, convertUrlImage } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "image-tools-mcp", version: "1.0.0" });
    server.registerTool("resize_image", {
        title: "Resize image",
        description: "Resize a local image to a new width.",
        inputSchema: z.object({ path: z.string().describe("Path to the source image."), width: z.number().describe("New width in pixels."), filename: z.string().describe("Output file name.").optional() }),
        annotations: WRITE,
    }, async (args) => {
        try {
            return text(await resizeImage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("inspect_image", {
        title: "Inspect image",
        description: "Return format, width, height, and file size of an image.",
        inputSchema: z.object({ path: z.string().describe("Path to the image.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await inspectImage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("probe_url", {
        title: "Probe url",
        description: "Download an image from a url and report its real format, dimensions, channels, alpha and density, which is how you find out what a server is actually serving.",
        inputSchema: z.object({ url: z.string().describe("Image url."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await probeUrl(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("convert_url_image", {
        title: "Convert url image",
        description: "Download an image from a url, optionally resize it, convert it to jpeg, png, webp, avif, tiff or gif and write the result to a temp file.",
        inputSchema: z.object({ url: z.string().describe("Image url."), format: z.string().describe("jpeg, png, webp, avif, tiff or gif.").optional(), width: z.number().describe("Resize width in pixels.").optional(), filename: z.string().describe("Output file name.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await convertUrlImage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "image-tools-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
