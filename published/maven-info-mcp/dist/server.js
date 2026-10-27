import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { artifact, search, dependencyBlock } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "maven-info-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Maven Central by query.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("artifact", {
        title: "Artifact",
        description: "Details for one artifact.",
        inputSchema: z.object({ groupId: z.string().describe("Group ID."), artifactId: z.string().describe("Artifact ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await artifact(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("release_timeline", {
        title: "Release timeline",
        description: "The release history of one artifact from Maven Central's version level index: how many versions exist, when the newest and oldest shipped, the median gap between releases, versions per calendar year, the packaging mix and how the version strings are shaped.",
        inputSchema: z.object({ groupId: z.string().describe("Group ID."), artifactId: z.string().describe("Artifact ID."), limit: z.number().describe("Versions to inspect, 1-50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement timeline locally (paywall removed)
        try {
            return textError("Not yet implemented: timeline");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("group_survey", {
        title: "Group survey",
        description: "What a Maven group actually ships: how many artifacts it has, the mean versions per artifact on the page, how many were last updated in each calendar year, how many are served from a repository other than central, and the tag vocabulary.",
        inputSchema: z.object({ groupId: z.string().describe("Group ID, e.g. org.springframework"), limit: z.number().describe("Artifacts to inspect, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement survey locally (paywall removed)
        try {
            return textError("Not yet implemented: survey");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dependency_block", {
        title: "Dependency block",
        description: "Resolve one Maven coordinate against Central's version index, classify the version as a release, milestone, candidate or snapshot, report its publish date and packaging, and emit a ready to paste Maven dependency block with a property based alternative and the POM path it resolves against.",
        inputSchema: z.object({ groupId: z.string().describe("Group ID."), artifactId: z.string().describe("Artifact ID."), version: z.string().describe("Specific version. Omit to use the newest on file.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dependencyBlock(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "maven-info-mcp";
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
