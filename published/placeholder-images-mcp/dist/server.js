import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_imageUrl, m0_listImages, m1_list } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'placeholder-images-mcp', version: '1.0.0' });
    server.registerTool("image_url", {
        title: "Image url",
        description: "Get a placeholder image URL.",
        inputSchema: z.object({ width: z.number().describe("Image width.").optional(), height: z.number().describe("Image height.").optional(), seed: z.string().describe("Stable seed string.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_imageUrl(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("list_images", {
        title: "List images",
        description: "List available placeholder images.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_listImages(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("list", {
        title: "List",
        description: "List recent Picsum photos.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_list(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("image_info", {
        title: "Image info",
        description: "One placeholder photo's full record: author, real dimensions, the Unsplash page behind it and the download url, which the url builder never shows.",
        inputSchema: z.object({ id: z.union([z.string(), z.number()]).describe("picsum image id, e.g. 0."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: image_info ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_placeholder_images_image_info", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("page_images", {
        title: "Page images",
        description: "Walk deeper into the picsum.photos placeholder catalogue by page, which the built-in listing never reaches past its first page.",
        inputSchema: z.object({ page: z.number().describe("Catalogue page.").optional(), limit: z.number().describe("Images per page.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: page_images ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_placeholder_images_page_images", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
