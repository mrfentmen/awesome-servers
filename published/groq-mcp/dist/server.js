import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { chat, GroqError, listModels, hubModelSearch, hubDatasetSearch } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "groq-mcp",
        version: "1.0.0",
    });
    server.registerTool("chat", {
        title: "Chat completion",
        description: "Ask a Groq-hosted LLM. Fast inference, OpenAI-compatible.",
        inputSchema: z.object({
            message: z.string().describe("User message"),
            model: z.string().default("llama-3.3-70b-versatile").describe("Model id (use list_models)"),
            system: z.string().default("").describe("Optional system prompt"),
        }),
        annotations: READ_ONLY,
    }, async ({ message, model, system }) => {
        try {
            return text(await chat(model, message, system));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_models", {
        title: "List models",
        description: "Model ids available to the Groq API key.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listModels();
            if (rows.length === 0)
                return text("No models.");
            return text(rows.map((m, i) => `${i + 1}. ${m}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hub_model_search", {
        title: "Hub model search",
        description: "Open weights on the Hugging Face Hub by popularity, with 30-day downloads, likes, task, library and licence. No key needed, unlike the Groq model list.",
        inputSchema: z.object({ search: z.string().describe("What to look for, e.g. 'mixtral' or 'whisper'"), limit: z.number().describe("Max results (default 10, max 30).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hubModelSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hub_dataset_search", {
        title: "Hub dataset search",
        description: "Datasets on the Hugging Face Hub by popularity, with downloads, likes, access gate, task categories and size band, for fine-tuning or evaluation.",
        inputSchema: z.object({ search: z.string().describe("What to look for, e.g. 'summarization'"), limit: z.number().describe("Max results (default 10, max 30).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hubDatasetSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "groq-mcp";
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
function errorMessage(e) {
    if (e instanceof GroqError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
