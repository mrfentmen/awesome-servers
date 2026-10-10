import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listModels, getModel, listModelFiles, getMe, categoryTree, categoryPath, taxonomyProfile } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "cgtrader-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_models", {
        title: "List models",
        description: "Page through CGTrader 3D models.",
        inputSchema: z.object({
            page: z.string().describe("Page number.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ page }) => {
        try {
            return text(await listModels(page));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_model", {
        title: "Get model",
        description: "One CGTrader model by id, with price and formats.",
        inputSchema: z.object({
            model_id: z.string().describe("Numeric model ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ model_id }) => {
        try {
            return text(await getModel(model_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_model_files", {
        title: "List model files",
        description: "Files attached to a CGTrader model.",
        inputSchema: z.object({
            model_id: z.string().describe("Numeric model ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ model_id }) => {
        try {
            return text(await listModelFiles(model_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_me", {
        title: "Get me",
        description: "User profile for the access token.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getMe());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("category_tree", {
        title: "Category tree",
        description: "The CGTrader category taxonomy as an indented tree, with child counts per node. Optional parent id to start from one branch, plus depth and minimum-children filters.",
        inputSchema: z.object({
            parent_id: z.number().int().optional().describe("Start the tree under this category id"),
            depth: z.number().int().min(1).max(5).default(2).describe("Levels to descend, default 2"),
            min_children: z.number().int().min(0).default(0).describe("Skip branches with fewer children than this"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: category_tree ----
        const paywallMessage = await premiumRequired("category_tree");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await categoryTree(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("category_path", {
        title: "Category path",
        description: "One CGTrader category by id or slug: its breadcrumb back to the root, how deep it sits, its direct children and its siblings.",
        inputSchema: z.object({
            category: z.string().describe("Category id or slug, e.g. 1 or aircraft"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await categoryPath(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("taxonomy_profile", {
        title: "Taxonomy profile",
        description: "The shape of the whole CGTrader taxonomy: root and leaf counts, max depth, categories per type, root categories ranked by how many descendants sit under them, and any dangling parent references.",
        inputSchema: z.object({
            min_descendants: z.number().int().min(1).default(1).describe("Only rank roots with at least this many descendants"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: taxonomy_profile ----
        const paywallMessage = await premiumRequired("taxonomy_profile");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await taxonomyProfile(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
