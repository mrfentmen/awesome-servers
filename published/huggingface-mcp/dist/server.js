import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { model, models } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "huggingface-mcp", version: "1.0.0" });
    server.registerTool("models", {
        title: "Models",
        description: "Public Hugging Face models.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional(), query: z.string().describe("Search terms.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await models(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("model", {
        title: "Model",
        description: "Details for one model.",
        inputSchema: z.object({ name: z.string().describe("Model id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await model(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("datasets", {
        title: "Datasets",
        description: "Search the datasets on the Hugging Face Hub, with likes, downloads, update date and whether a dataset is gated.",
        inputSchema: z.object({ search: z.string().describe("Search term.").optional(), author: z.string().describe("Owner, e.g. facebook.").optional(), limit: z.number().describe("Max datasets.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement datasets locally (paywall removed)
        try {
            return textError("Not yet implemented: datasets");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spaces", {
        title: "Spaces",
        description: "Search the Gradio, static and Docker Spaces on the Hugging Face Hub, with the runtime each Space declares.",
        inputSchema: z.object({ search: z.string().describe("Search term."), sdk: z.string().describe("gradio, static, docker or streamlit.").optional(), limit: z.number().describe("Max Spaces.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement spaces locally (paywall removed)
        try {
            return textError("Not yet implemented: spaces");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("space_detail", {
        title: "Space detail",
        description: "One Hugging Face Space's full record: runtime stage, requested hardware, tags and commit sha.",
        inputSchema: z.object({ space: z.string().describe("Space id as owner/name."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "huggingface-mcp";
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
