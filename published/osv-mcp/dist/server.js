import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatVulnerability, getVulnerability, OsvError, queryBatch, queryPackage } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "osv-mcp", version: "1.0.0" });
    server.registerTool("check_package", {
        title: "Check package",
        description: "Check a package and optional version for known open source vulnerabilities.",
        inputSchema: z.object({
            ecosystem: z.string().min(1).describe("OSV ecosystem, for example npm, PyPI, Go, crates.io, Maven, or NuGet"),
            name: z.string().min(1).describe("Package name"),
            version: z.string().optional().describe("Exact installed version, if known"),
        }),
        annotations: READ_ONLY,
    }, async ({ ecosystem, name, version }) => {
        try {
            const result = await queryPackage({ ecosystem, name, version });
            if (!result.vulns.length)
                return text(`No known OSV vulnerabilities found for ${ecosystem}/${name}${version ? `@${version}` : ""}.`);
            return text(`${ecosystem}/${name}${version ? `@${version}` : ""} has ${result.vulns.length} known vulnerability record(s):\n\n${result.vulns.map(formatVulnerability).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("scan_packages", {
        title: "Scan packages",
        description: "Scan several package references in one OSV request. Pass a JSON array of ecosystem, name, and optional version.",
        inputSchema: z.object({
            packages: z.array(z.object({ ecosystem: z.string().min(1), name: z.string().min(1), version: z.string().optional() })).min(1).max(100),
        }),
        annotations: READ_ONLY,
    }, async ({ packages }) => {
        try {
            const results = await queryBatch(packages);
            const vulnerable = results.filter((r) => r.vulns.length);
            if (!vulnerable.length)
                return text(`No known vulnerabilities found across ${packages.length} package(s).`);
            return text(vulnerable.map((r) => `${r.ref.ecosystem}/${r.ref.name}${r.ref.version ? `@${r.ref.version}` : ""}: ${r.vulns.length} record(s)\n${r.vulns.map(formatVulnerability).join("\n\n")}`).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_vulnerability", {
        title: "Get vulnerability",
        description: "Retrieve one OSV vulnerability by ID, such as GHSA, CVE, or OSV identifier.",
        inputSchema: z.object({
            id: z.string().min(1).describe("Vulnerability identifier, for example GHSA-... or CVE-..."),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text(formatVulnerability(await getVulnerability(id)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("advisory_database", {
        title: "Advisory database",
        description: "Search the GitHub Advisory Database: advisories affecting one package version, or the latest advisories for an ecosystem, with severity, CVSS, CWE and patch status.",
        inputSchema: z.object({
            ecosystem: z.string().min(1).optional().describe("GitHub ecosystem name: npm, pip, go, maven, nuget, rubygems, rust, packagist, actions. Defaults to npm."),
            package_name: z.string().min(1).optional().describe("Package name to look up advisories for. Takes priority over ecosystem."),
            version: z.string().min(1).optional().describe("Exact version of that package."),
            severity: z.string().min(1).optional().describe("Severity filter: low, moderate, high or critical. Only used when no package name is given."),
            limit: z.number().int().min(1).max(20).optional().describe("Max advisories, default 5."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement database locally (paywall removed)
        try {
            return textError("Not yet implemented: database");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("package_releases", {
        title: "Package releases",
        description: "Release history for a package from deps.dev: how many versions exist, when each was published, and the licenses and advisory links for a specific version.",
        inputSchema: z.object({
            system: z.string().min(1).describe("deps.dev system name, for example npm, PyPI, Go, crates.io, NuGet or Maven."),
            name: z.string().min(1).describe("Package name."),
            version: z.string().min(1).optional().describe("Exact version to report licenses and advisories for."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement releases locally (paywall removed)
        try {
            return textError("Not yet implemented: releases");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "osv-mcp";
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
export { OsvError };
