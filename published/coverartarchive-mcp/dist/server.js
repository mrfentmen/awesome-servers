import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CoverArtError, formatCover, frontUrl, getCover, coverImageBytes } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "coverartarchive-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_cover", {
        title: "Get cover art",
        description: "Get archived cover art for a MusicBrainz release or release-group: front/back URLs, thumbnails, image count.",
        inputSchema: z.object({
            mbid: z.string().describe("MusicBrainz ID, e.g. '76df3287-6cda-33eb-8e9a-044b5e15ffdd' (find it with musicbrainz-mcp)"),
            kind: z.enum(["release", "release-group"]).default("release"),
        }),
        annotations: READ_ONLY,
    }, async ({ mbid, kind }) => {
        try {
            return text(formatCover(await getCover(mbid, kind)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("front_url", {
        title: "Front cover URL",
        description: "Build a direct front-cover image URL for a MusicBrainz ID without fetching. Useful for embedding artwork.",
        inputSchema: z.object({
            mbid: z.string().describe("MusicBrainz release or release-group MBID"),
            kind: z.enum(["release", "release-group"]).default("release"),
            size: z.enum(["250", "500", "1200"]).default("500").describe("Thumbnail size in px"),
        }),
        annotations: READ_ONLY,
    }, async ({ mbid, kind, size }) => {
        try {
            return text(frontUrl(mbid, kind, Number(size)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cover_gallery", {
        title: "Cover gallery",
        description: "List every image the Cover Art Archive holds for a MusicBrainz MBID with its types, front and back flags, approval state, comment and full and thumbnail URLs, not just the single front cover.",
        inputSchema: z.object({ mbid: z.string().describe("MusicBrainz MBID, a 36 character UUID."), limit: z.number().describe("Max images.").optional(), front_only: z.boolean().describe("Only front covers.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement gallery locally (paywall removed)
        try {
            return textError("Not yet implemented: gallery");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_cover_releases", {
        title: "Find cover releases",
        description: "Search MusicBrainz for releases or release groups and report which of the results actually have artwork in the Cover Art Archive, with artists, dates and status.",
        inputSchema: z.object({ query: z.string().describe("Artist or release search terms."), limit: z.number().describe("Max results.").optional(), type: z.string().describe("release or release-group.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement releases locally (paywall removed)
        try {
            return textError("Not yet implemented: releases");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cover_image_bytes", {
        title: "Cover image bytes",
        description: "Download a specific cover art size and verify it really is an image by checking the file header, reporting content type, byte size, pixel dimensions and the final archive URL.",
        inputSchema: z.object({ mbid: z.string().describe("MusicBrainz MBID."), size: z.number().describe("250, 500 or 1200.").optional(), image_id: z.number().describe("Specific image id when a release has several.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await coverImageBytes(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "coverartarchive-mcp";
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
function errorMessage(e) {
    if (e instanceof CoverArtError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
