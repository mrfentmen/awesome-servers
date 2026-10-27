import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listSecrets, getSecret, createSecret, updateSecret, deleteSecret, secretNameHygiene } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "infisical-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_secrets", {
        title: "List secrets",
        description: "Secrets in an Infisical project environment and path.",
        inputSchema: z.object({
            projectId: z.string().describe("Project id"),
            environment: z.string().default("dev").describe("Environment slug"),
            secretPath: z.string().default("/").describe("Secret path"),
        }),
        annotations: READ_ONLY,
    }, async ({ projectId, environment, secretPath }) => {
        try {
            return text(await listSecrets(projectId, environment, secretPath));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_secret", {
        title: "Get one secret",
        description: "Single Infisical secret value by key.",
        inputSchema: z.object({
            projectId: z.string().describe("Project id"),
            environment: z.string().default("dev").describe("Environment"),
            secretPath: z.string().default("/").describe("Path"),
            key: z.string().describe("Secret key"),
        }),
        annotations: READ_ONLY,
    }, async ({ projectId, environment, secretPath, key }) => {
        try {
            return text(await getSecret(projectId, environment, secretPath, key));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_secret", {
        title: "Create secret",
        description: "Create an Infisical secret. Fails if the key already exists (use update).",
        inputSchema: z.object({
            projectId: z.string().describe("Project id"),
            environment: z.string().default("dev").describe("Environment"),
            secretPath: z.string().default("/").describe("Path"),
            key: z.string().describe("Secret key"),
            value: z.string().describe("Secret value"),
        }),
        annotations: NON_READ_ONLY,
    }, async ({ projectId, environment, secretPath, key, value }) => {
        try {
            return text(await createSecret(projectId, environment, secretPath, key, value));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("update_secret", {
        title: "Update secret",
        description: "Change an existing Infisical secret value.",
        inputSchema: z.object({
            projectId: z.string().describe("Project id"),
            environment: z.string().default("dev").describe("Environment"),
            secretPath: z.string().default("/").describe("Path"),
            key: z.string().describe("Secret key"),
            value: z.string().describe("New value"),
        }),
        annotations: NON_READ_ONLY,
    }, async ({ projectId, environment, secretPath, key, value }) => {
        try {
            return text(await updateSecret(projectId, environment, secretPath, key, value));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("delete_secret", {
        title: "Delete secret",
        description: "Delete an Infisical secret by key.",
        inputSchema: z.object({
            projectId: z.string().describe("Project id"),
            environment: z.string().default("dev").describe("Environment"),
            secretPath: z.string().default("/").describe("Path"),
            key: z.string().describe("Secret key"),
        }),
        annotations: NON_READ_ONLY,
    }, async ({ projectId, environment, secretPath, key }) => {
        try {
            return text(await deleteSecret(projectId, environment, secretPath, key));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("secret_entropy_audit", {
        title: "Audit secret strength",
        description: "Measure the strength of secret material you paste in, without any network call and without sending the values anywhere. Shannon entropy, charset size, placeholder and reuse detection.",
        inputSchema: z.object({
            secrets: z.string().describe("KEY=value lines, or a JSON object of key/value pairs"),
            label: z.string().optional().describe("Where this material came from, e.g. 'staging .env'"),
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
    server.registerTool("secret_name_hygiene", {
        title: "Check secret names",
        description: "Naming-convention check for secret keys: style, collisions, names that leak what they hold, names that are actually pasted values. Local only.",
        inputSchema: z.object({
            names: z.string().describe("Secret names, one per line or comma separated"),
            style: z.string().default("SHOUTING_SNAKE_CASE").describe("Style the names should follow"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await secretNameHygiene(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("secret_set_diff", {
        title: "Diff two secret sets",
        description: "Compare two pasted KEY=value sets (e.g. staging against production): keys missing on either side, values that differ, values reused across environments. Names and value lengths only, never the values.",
        inputSchema: z.object({
            left: z.string().describe("KEY=value lines for the first set"),
            right: z.string().describe("KEY=value lines for the second set"),
            left_label: z.string().optional().describe("Name for the first set, e.g. dev"),
            right_label: z.string().optional().describe("Name for the second set, e.g. prod"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement diff locally (paywall removed)
        try {
            return textError("Not yet implemented: diff");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "infisical-mcp";
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
    return server;
}
