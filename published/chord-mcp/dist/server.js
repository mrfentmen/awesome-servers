import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { chordNotes, scaleNotes } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "chord-mcp", version: "1.0.0" });
    server.registerTool("chord_notes", {
        title: "Chord notes",
        description: "Get the notes of a chord.",
        inputSchema: z.object({ root: z.string().describe("Root note like C or F#."), chord: z.string().describe("Chord type like maj, min, 7.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await chordNotes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("scale_notes", {
        title: "Scale notes",
        description: "Get the notes of a scale.",
        inputSchema: z.object({ root: z.string().describe("Root note."), scale: z.string().describe("Scale like major or minor.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await scaleNotes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("interval_between", {
        title: "Interval between notes",
        description: "Name and size of the interval between two notes, in semitones and cents.",
        inputSchema: z.object({ from: z.string().describe("Lower note, e.g. C."), to: z.string().describe("Upper note, e.g. G.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement between locally (paywall removed)
        try {
            return textError("Not yet implemented: between");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("key_signature", {
        title: "Key signature",
        description: "Accidentals in a key signature, the sharps or flats by name, and the relative key.",
        inputSchema: z.object({ root: z.string().describe("Tonic, e.g. D or Bb."), scale: z.string().describe("major or minor.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement signature locally (paywall removed)
        try {
            return textError("Not yet implemented: signature");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "chord-mcp";
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
