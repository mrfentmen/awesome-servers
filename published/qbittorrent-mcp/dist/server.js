import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listTorrents, getTransferInfo, getAppVersion, parseMagnet, torrentGeometry } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "qbittorrent-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_torrents", {
        title: "List torrents",
        description: "All torrents with progress, size and state.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listTorrents());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_transfer_info", {
        title: "Transfer stats",
        description: "Global upload and download speeds.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getTransferInfo());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_app_version", {
        title: "App version",
        description: "qBittorrent version and API version.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getAppVersion());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("parse_magnet", {
        title: "Parse a magnet link",
        description: "Read a magnet URI or a bare info hash: the v1 hash in both 40-character hex and 32-character base32, any v2 multihash topic, the suggested name, the claimed length and every tracker.",
        inputSchema: z.object({
            uri: z.string().describe("A magnet: URI, or a bare 32-character base32 v0 info hash"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await parseMagnet(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("torrent_geometry", {
        title: "Torrent geometry",
        description: "The piece arithmetic for a payload at a given piece length: piece count, the size of the final piece, the 16 KiB padding a .torrent needs and the resulting hash-list overhead.",
        inputSchema: z.object({
            size_bytes: z.number().describe("Total payload size in bytes, e.g. 4294967296 for 4 GiB"),
            piece_kb: z.number().describe("Piece length in KiB: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192 or 16384.").optional(),
            piece_size: z.number().describe("Piece length in bytes instead, a multiple of 16384. Overrides piece_kb.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await torrentGeometry(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "qbittorrent-mcp";
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
