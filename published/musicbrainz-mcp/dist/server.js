import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatArtist, formatRecording, formatRelease, getArtist, MusicBrainzError, searchArtists, searchRecordings, searchReleases } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "musicbrainz-mcp", version: "1.0.0" });
    server.registerTool("search_artists", {
        title: "Search artists",
        description: "Search MusicBrainz artists by name or query.",
        inputSchema: z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => { try {
        const r = await searchArtists(query, limit);
        return text(`Artists for "${query}" (${r.count ?? 0} total):\n\n${(r.artists ?? []).map((a, i) => formatArtist(a, i)).join("\n\n")}`);
    }
    catch (e) {
        return textError(String(e));
    } });
    server.registerTool("search_releases", {
        title: "Search releases",
        description: "Search albums and release editions in MusicBrainz.",
        inputSchema: z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => { try {
        const r = await searchReleases(query, limit);
        return text(`Releases for "${query}" (${r.count ?? 0} total):\n\n${(r.releases ?? []).map((x, i) => formatRelease(x, i)).join("\n\n")}`);
    }
    catch (e) {
        return textError(String(e));
    } });
    server.registerTool("search_recordings", {
        title: "Search recordings",
        description: "Search MusicBrainz recordings and track metadata.",
        inputSchema: z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => { try {
        const r = await searchRecordings(query, limit);
        return text(`Recordings for "${query}" (${r.count ?? 0} total):\n\n${(r.recordings ?? []).map((x, i) => formatRecording(x, i)).join("\n\n")}`);
    }
    catch (e) {
        return textError(String(e));
    } });
    server.registerTool("get_artist", {
        title: "Get artist",
        description: "Get one MusicBrainz artist by MBID.",
        inputSchema: z.object({ id: z.string().min(1) }),
        annotations: READ_ONLY,
    }, async ({ id }) => { try {
        return text(formatArtist(await getArtist(id)));
    }
    catch (e) {
        return textError(String(e));
    } });
    server.registerTool("search_release_groups", {
        title: "Search release groups",
        description: "Search MusicBrainz release groups, which collapse an artist's records across editions and reissues in a way individual release searches cannot.",
        inputSchema: z.object({ query: z.string().describe("Query, e.g. artist:radiohead."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement groups locally (paywall removed)
        try {
            return textError("Not yet implemented: groups");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_labels", {
        title: "Search labels",
        description: "Search MusicBrainz record labels by name, with country and lifespan, which the artist, release and recording searches never touch.",
        inputSchema: z.object({ query: z.string().describe("Label name, e.g. parlophone."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement labels locally (paywall removed)
        try {
            return textError("Not yet implemented: labels");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "musicbrainz-mcp";
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
    return server;
}
export { MusicBrainzError };
