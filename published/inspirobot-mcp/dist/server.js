import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generate, inscriptionMetrics } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "inspirobot-mcp", version: "1.0.0" });
    server.registerTool("generate", {
        title: "Generate",
        description: "One generated inspirational quote image URL.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_styled", {
        title: "Generate styled poster",
        description: "Render a poster with an inscription you supply plus font, script, alignment, line spacing and character spacing, then follow the returned URL to confirm the image is live and report its real content type and byte length.",
        inputSchema: z.object({ inscription: z.string().describe("Text to put on the poster, up to 200 characters."), font: z.string().describe("Font name. The service falls back silently on an unknown name.").optional(), script: z.string().describe("Script name.").optional(), align: z.number().describe("Alignment, 0-3.").optional(), lineSpacing: z.number().describe("Line spacing, 0-400.").optional(), charSpacing: z.number().describe("Character spacing, -50 to 200.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement styled locally (paywall removed)
        try {
            return textError("Not yet implemented: styled");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("font_matrix", {
        title: "Font matrix",
        description: "Render the same short inscription across up to four font names and measure each generated file, so you can see what each name actually produces rather than trusting it.",
        inputSchema: z.object({ inscription: z.string().describe("Short text to render, default 'measure this'.").optional(), fonts: z.string().describe("Comma separated font names, up to 4.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement matrix locally (paywall removed)
        try {
            return textError("Not yet implemented: matrix");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("inscription_metrics", {
        title: "Inscription metrics",
        description: "Check an inscription locally before spending a render: character and word counts, the longest word, how it would wrap at a width you choose, and which characters fall outside printable ASCII. No network call, no image generated.",
        inputSchema: z.object({ inscription: z.string().describe("Text to measure."), charsPerLine: z.number().describe("Characters per line for the wrap estimate, 4-200.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await inscriptionMetrics(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "inspirobot-mcp";
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
