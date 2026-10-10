import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listSecrets, getSecret, createSecret, updateSecret, deleteSecret, secretEntropyAudit, secretNameHygiene, secretSetDiff } from "./api.js";
import { premiumRequired } from "./license.js";
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
        // ---- paywall: secret_entropy_audit ----
        const paywallMessage = await premiumRequired("secret_entropy_audit");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await secretEntropyAudit(args));
        }
        catch (e) {
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
        // ---- paywall: secret_set_diff ----
        const paywallMessage = await premiumRequired("secret_set_diff");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await secretSetDiff(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
