import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { artifactHints, directoryWeights, format, inspect, manifest, sizeBudget, githubRepoStats } from "./gauge.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "artifact-gauge-mcp", version: "1.0.0" });
    server.registerTool("inspect_artifacts", {
        title: "Inspect artifacts",
        description: "Inspect local artifact sizes, extension totals, largest files, and dependency manifest names without returning file contents.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async ({ project }) => { try {
        return text(format(await inspect(project)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("inspect_manifest", {
        title: "Inspect manifest",
        description: "Inspect bounded metadata for one recognized local dependency manifest without returning its contents or versions.",
        inputSchema: z.object({ project: z.string().min(1).max(1000), file: z.string().min(1).max(500) }),
        annotations: READ_ONLY,
    }, async ({ project, file }) => { try {
        return text(format(await manifest(project, file)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("inspect_directory_weights", {
        title: "Inspect directory weights",
        description: "Byte totals and share of the total for each top level directory, largest first, without returning file contents.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async ({ project }) => {
        try {
            return text(format(await directoryWeights(project)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("inspect_size_budget", {
        title: "Inspect size budget",
        description: "Compare local artifact bytes against a budget and break the spend down by extension.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs"), budgetBytes: z.number().describe("Total byte budget to compare against.") }),
        annotations: READ_ONLY,
    }, async ({ project, budgetBytes }) => {
        try {
            return text(format(await sizeBudget(project, budgetBytes)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("inspect_artifact_hints", {
        title: "Inspect artifact hints",
        description: "Tally files whose extensions are commonly left behind by builds, logs and archives, without returning file contents.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async ({ project }) => {
        try {
            return text(format(await artifactHints(project)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("github_repo_stats", {
        title: "GitHub repository stats",
        description: "Read live GitHub repository size, popularity, issue count, language, license and last push data.",
        inputSchema: z.object({ owner: z.string().describe("GitHub owner; defaults to modelcontextprotocol.").optional(), repo: z.string().describe("GitHub repository; defaults to servers.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await githubRepoStats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "artifact-gauge-mcp";
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
