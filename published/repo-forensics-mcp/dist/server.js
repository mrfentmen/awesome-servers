import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, hotspots, hygiene, recentChanges, summary } from "./forensics.js";
import { churnProfile, contributorConcentration } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
const cwd = z.string().min(1).max(1000).default(".").describe("Local repository path. No network access is used.");
export function createServer() {
    const server = new McpServer({ name: "repo-forensics-mcp", version: "1.0.0" });
    server.registerTool("repository_summary", {
        title: "Repository summary",
        description: "Read branch, working-tree, remote names, and latest commit metadata from a local Git repository.",
        inputSchema: z.object({ cwd }),
        annotations: READ_ONLY,
    }, async ({ cwd: directory }) => { try {
        return text(format(await summary(directory)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("recent_changes", {
        title: "Recent changes",
        description: "List recent local Git commits with bounded output.",
        inputSchema: z.object({ cwd, limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async ({ cwd: directory, limit }) => { try {
        return text(format(await recentChanges(directory, limit)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("file_hotspots", {
        title: "File hotspots",
        description: "Find files that appear most often in recent repository history. This is a heuristic for review focus, not a defect detector.",
        inputSchema: z.object({ cwd, limit: z.number().int().min(1).max(50).default(20) }),
        annotations: READ_ONLY,
    }, async ({ cwd: directory, limit }) => { try {
        return text(format(await hotspots(directory, limit)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("top_level_hygiene", {
        title: "Top level hygiene",
        description: "Check top-level large files, .gitignore presence, and working-tree dirtiness without reading file contents.",
        inputSchema: z.object({ cwd }),
        annotations: READ_ONLY,
    }, async ({ cwd: directory }) => { try {
        return text(format(await hygiene(directory)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("churn_profile", {
        title: "Churn profile",
        description: "Aggregate local Git history into a churn profile: file-change concentration, a Gini coefficient, churn classes, long-tail share, busiest top-level directories and busiest file extensions. A review-focus heuristic, not a defect detector.",
        inputSchema: z.object({ cwd, commits: z.number().int().min(10).max(1000).default(200) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await churnProfile(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("contributor_concentration", {
        title: "Contributor concentration",
        description: "Measure how concentrated local Git authorship is: distinct contributors, top-1/3/10 commit shares, a bus factor and a Gini coefficient. No contributor names, email addresses, hashes or subjects are returned.",
        inputSchema: z.object({ cwd, commits: z.number().int().min(10).max(5000).default(500) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await contributorConcentration(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    const serverName = "repo-forensics-mcp";
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
