import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChanError, formatPost, formatThreadSummary, getCatalog, getThread, listBoards, boardConfig } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "fourchan-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_boards", {
        title: "List boards",
        description: "List all 4chan boards with titles and SFW flags.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const boards = await listBoards();
            const sfw = boards.filter((b) => b.sfw);
            const nsfw = boards.filter((b) => !b.sfw);
            return text(`SFW boards:\n${sfw.map((b) => `  /${b.board}/ — ${b.title}`).join("\n")}\n\n` +
                `NSFW boards:\n${nsfw.map((b) => `  /${b.board}/ — ${b.title}`).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_catalog", {
        title: "Get catalog",
        description: "Get the catalog (all live threads) for a board.",
        inputSchema: z.object({ board: z.string().describe("Board, e.g. 'g', 'v', 'biz', 'pol'"), limit: z.number().int().min(1).max(50).default(20) }),
        annotations: READ_ONLY,
    }, async ({ board, limit }) => {
        try {
            const threads = await getCatalog(board);
            if (threads.length === 0)
                return text(`No threads on /${board}/.`);
            const sorted = [...threads].sort((a, b) => b.replies - a.replies).slice(0, limit);
            return text(`/${board}/ catalog — top ${sorted.length} by replies:\n\n` +
                sorted.map((t, i) => formatThreadSummary(t, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_thread", {
        title: "Get thread",
        description: "Read a thread's posts by thread number.",
        inputSchema: z.object({ board: z.string().describe("Board, e.g. 'g'"), threadNo: z.number().int().describe("Thread number from get_catalog") }),
        annotations: READ_ONLY,
    }, async ({ board, threadNo }) => {
        try {
            const posts = await getThread(board, threadNo);
            if (posts.length === 0)
                return text(`Thread ${threadNo} on /${board}/ has no posts.`);
            const max = Math.min(posts.length, 25);
            return text(`/${board}/ thread ${threadNo} — ${posts.length} posts (showing ${max}):\n\n` +
                posts.slice(0, max).map(formatPost).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("board_thread_index", {
        title: "Board thread index",
        description: "Compact live-thread index for a 4chan board: every thread's number, bump time and reply/image counts, newest first.",
        inputSchema: z.object({
            board: z.string().describe("Board, e.g. 'g', 'biz', 'pol'"),
            limit: z.number().int().min(1).max(200).default(20).describe("Max threads"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement index locally (paywall removed)
        try {
            return textError("Not yet implemented: index");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("board_config", {
        title: "Board configuration",
        description: "The limits 4chan publishes for one board: pages, threads per page, bump and image caps, upload ceilings, cooldowns, archived state.",
        inputSchema: z.object({
            board: z.string().describe("Board, e.g. 'g'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await boardConfig(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("thread_media_gallery", {
        title: "Thread media gallery",
        description: "Every media attachment in a 4chan thread with dimensions, thumbnail size, md5 and a live check of whether the file is still on the CDN.",
        inputSchema: z.object({
            board: z.string().describe("Board, e.g. 'g'"),
            threadNo: z.number().int().describe("Thread number from board_thread_index"),
            limit: z.number().int().min(1).max(20).default(15).describe("Max files"),
        }),
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
    const serverName = "fourchan-mcp";
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
function errorMessage(e) {
    if (e instanceof ChanError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
