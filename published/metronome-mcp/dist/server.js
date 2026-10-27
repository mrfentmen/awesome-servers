import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bpmToMs, noteDuration } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "metronome-mcp", version: "1.0.0" });
    server.registerTool("bpm_to_ms", {
        title: "Bpm to ms",
        description: "Convert BPM to beat and bar durations.",
        inputSchema: z.object({ bpm: z.number().describe("Beats per minute."), beats_per_bar: z.number().describe("Beats per bar.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bpmToMs(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("note_duration", {
        title: "Note duration",
        description: "Get note durations in milliseconds at a BPM.",
        inputSchema: z.object({ bpm: z.number().describe("Beats per minute.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await noteDuration(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reference_recordings", {
        title: "Reference recordings",
        description: "Find recordings of a piece to practise against on MusicBrainz: performer, length, first release date and what it appears on.",
        inputSchema: z.object({ query: z.string().describe("Piece or recording title, e.g. 'Flight of the Bumblebee'."), limit: z.number().describe("Max recordings, 1-25, default 6.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement recordings locally (paywall removed)
        try {
            return textError("Not yet implemented: recordings");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("piece_reference", {
        title: "Piece reference",
        description: "Look up a musical work on Wikidata: notated tempo, composer, performer, genre, form of work and first publication date.",
        inputSchema: z.object({ title: z.string().describe("Title of the work, e.g. 'Piano Sonata No. 14'."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement reference locally (paywall removed)
        try {
            return textError("Not yet implemented: reference");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "metronome-mcp";
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
