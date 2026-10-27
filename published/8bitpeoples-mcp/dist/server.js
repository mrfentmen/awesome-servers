import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BitError, formatRelease, getRelease, listReleases, listArtists } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "8bitpeoples-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_releases", {
        title: "List releases",
        description: "Browse the 8bitpeoples catalog. Chiptune and chip-hop releases, " +
            "mostly free to download.",
        inputSchema: z.object({ page: z.number().int().min(1).default(1).describe("Catalog page (about 24 releases each)") }),
        annotations: READ_ONLY,
    }, async ({ page }) => {
        try {
            const releases = await listReleases(page);
            if (releases.length === 0)
                return text(`Nothing on catalog page ${page}.`);
            return text(`8bitpeoples catalog page ${page}:\n\n` +
                releases.map((r, i) => formatRelease(r, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_release", {
        title: "Get release",
        description: "Get details for one release: artist, description, price.",
        inputSchema: z.object({ slug: z.string().describe("Release slug, e.g. '520414-sievert-chips-dips-and-facerips'") }),
        annotations: READ_ONLY,
    }, async ({ slug }) => {
        try {
            const r = await getRelease(slug);
            if (!r)
                return text(`No release at ${slug}.`);
            return text(formatRelease(r));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_artists", {
        title: "List artists",
        description: "Artists on the 8bitpeoples label, with the slug to pass to artist_releases.",
        inputSchema: z.object({ limit: z.number().describe("How many artists, 1-200.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listArtists(args.limit ?? 100));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("artist_releases", {
        title: "Artist releases",
        description: "Releases by one 8bitpeoples artist, looked up by the artist slug from list_artists.",
        inputSchema: z.object({ slug: z.string().describe("Artist slug, e.g. '8gb'."), limit: z.number().describe("How many releases, 1-100.").optional() }),
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
    server.registerTool("release_tracks", {
        title: "Release tracks",
        description: "Tracklist and catalog number for one 8bitpeoples release, plus the credited artists.",
        inputSchema: z.object({ slug: z.string().describe("Release slug, e.g. '520414-sievert-chips-dips-and-facerips'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tracks locally (paywall removed)
        try {
            return textError("Not yet implemented: tracks");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "8bitpeoples-mcp";
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
    if (e instanceof BitError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
