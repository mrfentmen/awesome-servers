import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listProjects, listConfigs, listSecrets, downloadSecrets, configLockStatus, inheritableSecrets, secretDiff } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "doppler-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_projects", {
        title: "List projects",
        description: "Doppler projects with names and descriptions.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listProjects());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_configs", {
        title: "List configs",
        description: "Doppler configs (environments) in a project.",
        inputSchema: z.object({
            project: z.string().describe("Project name or slug"),
        }),
        annotations: READ_ONLY,
    }, async ({ project }) => {
        try {
            return text(await listConfigs(project));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_secrets", {
        title: "List secrets",
        description: "Secrets in a Doppler config with raw and computed values plus visibility.",
        inputSchema: z.object({
            project: z.string().describe("Project name, e.g. backend"),
            config: z.string().describe("Config, e.g. 'dev'"),
            secrets: z.string().optional().describe("Comma-separated names to include"),
        }),
        annotations: READ_ONLY,
    }, async ({ project, config, secrets }) => {
        try {
            return text(await listSecrets(project, config, secrets));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("download_secrets", {
        title: "Download secrets",
        description: "Doppler config secrets as JSON, env file, or dotenv for local use.",
        inputSchema: z.object({
            project: z.string().describe("Project name, e.g. backend"),
            config: z.string().describe("Config name, e.g. dev"),
            format: z.string().default("json").describe("json, env or dotenv"),
        }),
        annotations: READ_ONLY,
    }, async ({ project, config, format }) => {
        try {
            return text(await downloadSecrets(project, config, format));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("config_lock_status", {
        title: "Config lock status",
        description: "Whether each config in a Doppler project is locked, with the lock note and the environments under each config. A lock is the control that stops a routine secret edit reaching production, and an unlocked production config means anyone with write access can change live secrets immediately. Reads the lock state per config and distinguishes a genuine error from an unlocked config.",
        inputSchema: z.object({
            project: z.string().describe("Doppler project id or name."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await configLockStatus(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("inheritable_secrets", {
        title: "Inheritable secrets",
        description: "Which secrets in one Doppler config cascade into other configs and environments, and exactly where each one lands. This is how a single development value silently becomes a production value, and it is the first thing to check when production is wrong but development is right. Reports names and destinations only, never values.",
        inputSchema: z.object({
            project: z.string().describe("Doppler project id or name."),
            config: z.string().describe("Config to inspect, for example dev or prd."),
            limit: z.number().int().min(1).max(200).default(40).describe("Secrets to list, default 40"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: inheritable_secrets ----
        const paywallMessage = await premiumRequired("inheritable_secrets");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await inheritableSecrets(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("secret_diff", {
        title: "Diff two configs",
        description: "Compares the secrets of two Doppler configs and reports what differs, what exists in only one, and what is identical, comparing the computed value an application actually receives while also noting whether a side sets the value or inherits it. Never prints a secret value, only whether one is set and whether the two agree.",
        inputSchema: z.object({
            project: z.string().describe("Doppler project id or name."),
            from_config: z.string().describe("Config to compare from, for example dev."),
            to_config: z.string().describe("Config to compare to, for example prd."),
            limit: z.number().int().min(1).max(200).default(40).describe("Differing secrets to list, default 40"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: secret_diff ----
        const paywallMessage = await premiumRequired("secret_diff");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await secretDiff(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
