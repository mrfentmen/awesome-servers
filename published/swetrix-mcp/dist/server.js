import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listProjects, getProject, campaignParameters, sdkReleaseFeed, ecosystemAudit } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "swetrix-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_projects", {
        title: "List projects",
        description: "All Swetrix projects with ids and domains.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listProjects());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_project", {
        title: "Get project",
        description: "One Swetrix project with settings and stats summary.",
        inputSchema: z.object({
            projectId: z.string().describe("Swetrix project ID, e.g. 12345"),
        }),
        annotations: READ_ONLY,
    }, async ({ projectId }) => {
        try {
            return text(await getProject(projectId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("campaign_parameters", {
        title: "Campaign parameters",
        description: "Audit the utm_ parameters on a list of URLs, computed locally: which campaigns, sources and mediums they name and how often, how many URLs are untagged or only partly tagged, whether term and content are missing, and the case or stray-parameter mistakes that split one channel across two rows in a report.",
        inputSchema: z.object({
            urls: z.string().describe("One URL per line, up to 30000 characters."),
            limit: z.number().describe("How many rows per breakdown to show, 1-20.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await campaignParameters(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sdk_release_feed", {
        title: "SDK release feed",
        description: "The published swetrix tracker package on npm: latest version, how many versions exist, days since the last publish, the median, shortest and longest gap between releases, its dependency count, last week's download count, the most recent versions by date, and the project's newest GitHub release tags for comparison.",
        inputSchema: z.object({ limit: z.number().describe("How many versions and releases to show, 1-10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sdkReleaseFeed(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ecosystem_audit", {
        title: "Ecosystem audit",
        description: "The project's shape from GitHub: licence, age, days since the last push, stars, forks, watchers and open issues, the language mix as a share of bytes, contributors ranked by commits with the top contributor's share, and an explicit judgement on the bus factor and on whether a single language dominates the codebase.",
        inputSchema: z.object({ limit: z.number().describe("How many languages and contributors to show, 1-10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ecosystemAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "swetrix-mcp";
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
