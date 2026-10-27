import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { imageInfo, searchImages, namespaceRepositories } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "docker-hub-mcp", version: "1.0.0" });
    server.registerTool("image_info", {
        title: "Image info",
        description: "Get details for a Docker image.",
        inputSchema: z.object({ name: z.string().describe("Image name like library/nginx.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await imageInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_images", {
        title: "Search images",
        description: "Search Docker Hub images.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchImages(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tag_list", {
        title: "Tag list",
        description: "Every tag of a Docker image with its platforms, per platform sizes and last push dates.",
        inputSchema: z.object({ name: z.string().describe("Image name like library/nginx."), limit: z.number().describe("Tags to show, 1-100. Defaults to 25.").optional(), sort: z.string().describe("last_updated or name. Defaults to last_updated.").optional(), page: z.number().describe("Page number, starting at 1.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("namespace_repositories", {
        title: "Namespace repositories",
        description: "Every repository under one Docker Hub namespace, with pull counts, stars and last update.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace, like library for official images or bitnami."), limit: z.number().describe("Repositories to show, 1-100. Defaults to 25.").optional(), sort: z.string().describe("pull_count, last_updated or name. Defaults to pull_count.").optional(), page: z.number().describe("Page number, starting at 1.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await namespaceRepositories(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tag_platforms", {
        title: "Tag platforms",
        description: "The platform images behind one tag, with the immutable digest to pin for each architecture.",
        inputSchema: z.object({ name: z.string().describe("Image name like library/nginx."), tag: z.string().describe("Tag, like 1.27 or stable-alpine.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement platforms locally (paywall removed)
        try {
            return textError("Not yet implemented: platforms");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "docker-hub-mcp";
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
    return server;
}
