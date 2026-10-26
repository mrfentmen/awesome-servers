import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listProjects, listRuns, myProfile, WandbError, datasetCatalogue } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "weightsbiases-mcp",
        version: "1.0.0",
    });
    server.registerTool("my_profile", {
        title: "My profile",
        description: "The W&B user the API key belongs to.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const p = await myProfile();
            return text(`${p.username ?? "?"}${p.email ? ` <${p.email}>` : ""}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_projects", {
        title: "List projects",
        description: "ML projects of a user or team.",
        inputSchema: z.object({
            entity: z.string().describe("Username or team, e.g. your W&B handle"),
            limit: z.number().int().min(1).max(50).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ entity, limit }) => {
        try {
            const rows = await listProjects(entity, limit);
            if (rows.length === 0)
                return text(`No projects for ${entity}.`);
            return text(rows.map((p, i) => `${i + 1}. ${p.entity ?? entity}/${p.name}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_runs", {
        title: "List runs",
        description: "Recent training runs of a project with states.",
        inputSchema: z.object({
            entity: z.string().describe("Username or team"),
            project: z.string().describe("Project name"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ entity, project, limit }) => {
        try {
            const rows = await listRuns(entity, project, limit);
            if (rows.length === 0)
                return text(`No runs in ${entity}/${project}.`);
            return text(rows.map((r, i) => `${i + 1}. ${r.name ?? "?"} [${r.state ?? "?"}]${r.created ? ` (${r.created})` : ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("model_card_audit", {
        title: "Model card audit",
        description: "What a public model actually declares: licence, the datasets it was trained on, language and task categories, parameter count and precision from the safetensors index, weight and config files, tags, and the author's other popular models. No W&B account token needed.",
        inputSchema: z.object({
            model: z.string().describe("Model id such as google-bert/bert-base-uncased, or the model page URL"),
            siblings: z.number().describe("Other models by the same author listed, 0-20. Defaults to 6.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement audit locally (paywall removed)
        try {
            return textError("Not yet implemented: audit");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dataset_catalogue", {
        title: "Dataset catalogue",
        description: "The public dataset index for a subject: each repository with downloads, likes, declared licence and language, config count, tags, gated and private flags, and how many authors are involved. No W&B account token needed.",
        inputSchema: z.object({
            query: z.string().describe("Subject to search for, e.g. sentiment, medical, code"),
            limit: z.number().describe("Datasets listed, 1-30. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await datasetCatalogue(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "weightsbiases-mcp";
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
function errorMessage(e) {
    if (e instanceof WandbError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
