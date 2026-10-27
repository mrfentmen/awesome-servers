import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { model, models, creatorModels, modelVersion } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "civitai-mcp", version: "1.0.0" });
    server.registerTool("models", {
        title: "Models",
        description: "Public Civitai models.",
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
        inputSchema: z.object({ id: z.number().describe("Model ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await model(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("model_version", {
        title: "Model version",
        description: "One released model version in full: its base model, trigger words, stats, every downloadable file with its size, sha256 and virus and pickle scan results, and the generation settings behind the example images, seed by seed. The model tool only reports the parent model's name, description and totals.",
        inputSchema: z.object({ version_id: z.number().describe("Model version ID, like 290640. The models tool's rows carry these under versions.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await modelVersion(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("creator_models", {
        title: "Creator models",
        description: "Everything one Civitai creator has published: each model with its type, downloads, thumbs up, version count, base models and tags, plus the total downloads across the models shown. The models tool searches by text only and cannot filter to a creator.",
        inputSchema: z.object({ username: z.string().describe("Civitai username, like JustMaier."), limit: z.number().describe("Max models, 1 to 30.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await creatorModels(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "civitai-mcp";
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
