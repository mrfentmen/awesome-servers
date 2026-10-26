import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listOrgs, orgProjects, orgIssues, issueDetails, issueEvents, projectDetails, teams, members, releases, eventDetails, releaseFeed, dependencyDrift } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "sentry-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_orgs", {
        title: "List orgs",
        description: "Sentry organizations the token can read.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listOrgs());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("org_projects", {
        title: "Org projects",
        description: "Projects inside one Sentry org, e.g. my-org.",
        inputSchema: z.object({
            org: z.string().describe("Org slug from the Sentry URL, e.g. my-org")
        }),
        annotations: READ_ONLY,
    }, async ({ org }) => {
        try {
            return text(await orgProjects(org));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("org_issues", {
        title: "Org issues",
        description: "Issues first seen in one org in the last 24 hours.",
        inputSchema: z.object({
            org: z.string().describe("Org slug from the Sentry URL, e.g. my-org")
        }),
        annotations: READ_ONLY,
    }, async ({ org }) => {
        try {
            return text(await orgIssues(org));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("issue_details", {
        title: "Issue details",
        description: "Single issue.",
        inputSchema: z.object({
            org: z.string().describe("Org slug."),
            issue_id: z.string().describe("Issue ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ org, issue_id }) => {
        try {
            return text(await issueDetails(org, issue_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("issue_events", {
        title: "Issue events",
        description: "Recent events.",
        inputSchema: z.object({
            org: z.string().describe("Org slug."),
            issue_id: z.string().describe("Issue ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ org, issue_id }) => {
        try {
            return text(await issueEvents(org, issue_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("project_details", {
        title: "Project details",
        description: "Single project.",
        inputSchema: z.object({
            org: z.string().describe("Org slug."),
            project: z.string().describe("Project slug.")
        }),
        annotations: READ_ONLY,
    }, async ({ org, project }) => {
        try {
            return text(await projectDetails(org, project));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("teams", {
        title: "Teams",
        description: "Org teams.",
        inputSchema: z.object({
            org: z.string().describe("Org slug.")
        }),
        annotations: READ_ONLY,
    }, async ({ org }) => {
        try {
            return text(await teams(org));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("members", {
        title: "Members",
        description: "Org members.",
        inputSchema: z.object({
            org: z.string().describe("Org slug.")
        }),
        annotations: READ_ONLY,
    }, async ({ org }) => {
        try {
            return text(await members(org));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("releases", {
        title: "Releases",
        description: "Recent releases.",
        inputSchema: z.object({
            org: z.string().describe("Org slug.")
        }),
        annotations: READ_ONLY,
    }, async ({ org }) => {
        try {
            return text(await releases(org));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("event_details", {
        title: "Event details",
        description: "Single event payload.",
        inputSchema: z.object({
            org: z.string().describe("Org slug."),
            issue_id: z.string().describe("Issue ID."),
            event_id: z.string().describe("Event ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ org, issue_id, event_id }) => {
        try {
            return text(await eventDetails(org, issue_id, event_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("release_feed", {
        title: "Release feed",
        description: "A package's release channels right now: what latest, lts, next and the major-version tags point at, how fast stable versions ship, and what the latest release requires of the host and depends on.",
        inputSchema: z.object({
            package: z.string().describe("Package name, e.g. '@sentry/node' or 'express'"),
            limit: z.number().describe("Max recent releases listed, 1-20. Defaults to 8.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: release_feed ----
        try {
            return text(await releaseFeed(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("dependency_drift", {
        title: "Dependency drift",
        description: "How a package's direct runtime dependencies have changed across its recent stable releases: what each step added and dropped, and the net change in the dependency surface.",
        inputSchema: z.object({
            package: z.string().describe("Package name, e.g. '@sentry/node'"),
            releases: z.number().describe("How many recent stable releases to compare, 2-20. Defaults to 6.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: dependency_drift ----
        try {
            return text(await dependencyDrift(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
