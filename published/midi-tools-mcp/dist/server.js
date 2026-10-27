import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { noteFrequency, noteFromName, noteName, buildScale, interval } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "midi-tools-mcp", version: "1.0.0" });
    server.registerTool("note_name", {
        title: "Note name",
        description: "Get the note name for a MIDI number.",
        inputSchema: z.object({ midi: z.number().describe("MIDI note number 0 to 127.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await noteName(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("note_frequency", {
        title: "Note frequency",
        description: "Get the frequency of a MIDI note.",
        inputSchema: z.object({ midi: z.number().describe("MIDI note number.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await noteFrequency(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("note_from_name", {
        title: "Note from name",
        description: "Get the MIDI number for a note name.",
        inputSchema: z.object({ name: z.string().describe("Note name like C4 or F#3.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await noteFromName(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("build_chord", {
        title: "Build chord",
        description: "Build a triad or seventh chord from a root note and a quality, with note names, MIDI numbers and frequencies. Locally computed, no network.",
        inputSchema: z.object({
            root: z.string().describe("Root note, e.g. C4, F#3, Bb2."),
            quality: z.string().describe("Chord quality, e.g. major, minor, dom7, maj7, dim7, sus4.").optional(),
            octave: z.number().int().min(-1).max(9).describe("Octave of the root when the name has none, default 4.").optional(),
            inversion: z.number().int().min(0).max(3).describe("Inversion 0-3, default 0.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement chord locally (paywall removed)
        try {
            return textError("Not yet implemented: chord");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("build_scale", {
        title: "Build scale",
        description: "Build a scale from a root note and a scale name, with note names, MIDI numbers, frequencies and the key signature.",
        inputSchema: z.object({
            root: z.string().describe("Root note, e.g. D4, Bb3."),
            scale: z.string().describe("Scale name, e.g. major, natural minor, dorian, lydian, harmonic minor, blues.").optional(),
            octaves: z.number().int().min(1).max(4).describe("Octaves to list, 1-4, default 2.").optional(),
            octave: z.number().int().min(-1).max(9).describe("Octave of the root when the name has none, default 4.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await buildScale(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("interval", {
        title: "Interval",
        description: "Name the interval between two notes, or name the interval a semitone count represents and give the note it lands on from A4.",
        inputSchema: z.object({
            from: z.string().describe("First note, e.g. C4.").optional(),
            to: z.string().describe("Second note, e.g. G4.").optional(),
            semitones: z.number().int().min(0).max(127).describe("Semitones above A4, used when from/to are absent.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await interval(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "midi-tools-mcp";
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
