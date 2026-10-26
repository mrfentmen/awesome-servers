import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listModels, keyInfo, credits, getModel, searchModels, freeModels, longestContext, modelEndpoints, generationStats, promptCostEstimate, modelEconomicsMatrix, deprecationWatch } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "openrouter-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_models", {
        title: "List models",
        description: "Models available on OpenRouter, with context size and price.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listModels());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("key_info", {
        title: "Key info",
        description: "What the current key can spend, and how much is left.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await keyInfo());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("credits", {
        title: "Credits",
        description: "Remaining credit balance for the account.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await credits());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_model", {
        title: "Get model",
        description: "Model metadata by ID.",
        inputSchema: z.object({
            model_id: z.string().describe("e.g. openai/gpt-4o.")
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
    server.registerTool("search_models", {
        title: "Search models",
        description: "Models matching text.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            limit: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchModels(query, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("free_models", {
        title: "Free models",
        description: ":free tier models.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await freeModels(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("longest_context", {
        title: "Biggest context",
        description: "Top context windows.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await longestContext(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("model_endpoints", {
        title: "Model endpoints",
        description: "Providers/pricing per model.",
        inputSchema: z.object({
            author: z.string().describe("e.g. openai."),
            slug: z.string().describe("e.g. gpt-4o.")
        }),
        annotations: READ_ONLY,
    }, async ({ author, slug }) => {
        try {
            return text(await modelEndpoints(author, slug));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("generation_stats", {
        title: "Generation stats",
        description: "Cost/usage of a completion.",
        inputSchema: z.object({
            generation_id: z.string().describe("Generation ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ generation_id }) => {
        try {
            return text(await generationStats(generation_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("prompt_cost_estimate", {
        title: "Prompt cost estimate",
        description: "What a request costs at the prices OpenRouter publishes right now: total cost for given input and output token counts, the per-million prompt and completion rates behind it, the same request served from prompt cache where a cache price is published, and context window and tool support. With no model named, compares the cheapest options.",
        inputSchema: z.object({
            input_tokens: z.number().describe("Input tokens in the request."),
            output_tokens: z.number().describe("Tokens you expect back."),
            model: z.string().describe("Model id or slug, e.g. anthropic/claude-sonnet-5.5. Omit to compare the cheapest.").optional(),
            compare: z.number().describe("How many models to compare, 1-10.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await promptCostEstimate(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("model_economics_matrix", {
        title: "Model economics matrix",
        description: "The catalogue as a market: how many models are listed and billable, the 25th, median and 75th percentile prompt and completion price per million tokens, the cheapest and most expensive models, the context-length and input-modality distribution, provider concentration, capability mix and the newest entries.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (_args) => {
        // ---- paywall: model_economics_matrix ----
        try {
            return text(await modelEconomicsMatrix(_args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("deprecation_watch", {
        title: "Deprecation watch",
        description: "Which models in the catalogue announce a retirement date, soonest first with the days remaining, plus how fresh the catalogue is by knowledge cutoff year and how many models declare a cutoff more than a year old.",
        inputSchema: z.object({ limit: z.number().describe("How many expiring models to name, 1-10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: deprecation_watch ----
        try {
            return text(await deprecationWatch(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
