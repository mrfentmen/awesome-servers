import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, browse, getFile, getLatestAlert } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "chmi-mcp",
        version: "1.0.0",
    });
    server.registerTool("browse", {
        title: "Browse open data",
        description: "List CHMI open-data directories and files, e.g. '/', 'meteorology/weather/alerts/'.",
        inputSchema: z.object({
            path: z.string().default("/").describe("Directory path"),
        }),
        annotations: READ_ONLY,
    }, async ({ path }) => {
        try {
            return text(await browse(path));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_file", {
        title: "Download file",
        description: "Download a CHMI open-data text file (CSV, XML, JSON, TXT), truncated.",
        inputSchema: z.object({
            path: z.string().describe("File path from browse"),
        }),
        annotations: READ_ONLY,
    }, async ({ path }) => {
        try {
            return text(await getFile(path));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_latest_alert", {
        title: "Get latest warning",
        description: "Newest CHMI weather warning file content.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getLatestAlert());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("directory_stats", {
        title: "Directory stats",
        description: "Summarise a CHMI open-data directory: entry counts, total listed size, date range, subdirectories, file type breakdown and the most recently modified files.",
        inputSchema: z.object({
            path: z.string().default("/").describe("Directory path"),
            top: z.number().int().min(1).max(20).default(5).describe("How many recent files to list"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: directory_stats ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_chmi_directory_stats", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("directory_tree", {
        title: "Directory tree",
        description: "Walk CHMI open-data subdirectories to a given depth, showing each directory and the date the index reports for it.",
        inputSchema: z.object({
            path: z.string().default("/").describe("Directory path to start from"),
            depth: z.number().int().min(1).max(3).default(2).describe("Levels to descend"),
            limit: z.number().int().min(1).max(300).default(60).describe("Max directories to list"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: directory_tree ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_chmi_directory_tree", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("find_documents", {
        title: "Find documents",
        description: "Search the CHMI open-data file names under a path for all the given words at once, reporting each match with its size and date. browse lists one directory and directory_tree walks directories only, so nothing on this server could search for a file.",
        inputSchema: z.object({ query: z.string().describe("Words that must all appear in a file name, e.g. 'chemical' or 'alert'."), path: z.string().optional().describe("Directory to search under, e.g. '/' or 'meteorology/weather/'. Default '/'."), depth: z.number().int().describe("How many directory levels to walk, 1-5.").optional(), limit: z.number().int().describe("Max matches to return, 1-200.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: find_documents ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_chmi_find_documents", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
