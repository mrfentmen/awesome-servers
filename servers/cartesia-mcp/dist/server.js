import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listVoices, getVoice, synthesizeSpeech, searchVoices, languageRollCall, pickVoice } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "cartesia-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_voices", {
        title: "List voices",
        description: "Voices available on the account, with language.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listVoices(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_voice", {
        title: "Get voice",
        description: "One voice by id, with its embedding and settings.",
        inputSchema: z.object({
            voice_id: z.string().describe("Voice ID from Cartesia, e.g. a0e7d23f")
        }),
        annotations: READ_ONLY,
    }, async ({ voice_id }) => {
        try {
            return text(await getVoice(voice_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("synthesize_speech", {
        title: "Synthesize speech",
        description: "Render text to MP3 with a voice — this spends credits.",
        inputSchema: z.object({
            transcript: z.string().describe("Text to speak."),
            voice_id: z.string().describe("Voice ID from Cartesia, e.g. a0e7d23f"),
            model_id: z.string().describe("Model (default sonic-2).").optional()
        }),
        annotations: MUTATING,
    }, async ({ transcript, voice_id, model_id }) => {
        try {
            return text(await synthesizeSpeech(transcript, voice_id, model_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_voices", {
        title: "Search voices",
        description: "Search the Cartesia voice library by name, description or id, with language and gender filters. Reports tagline, spoken locales and whether a preview exists.",
        inputSchema: z.object({
            query: z.string().optional().describe("Free text matched against name, description and voice id"),
            language: z.string().optional().describe("Two-letter language code, e.g. en"),
            gender: z.enum(["masculine", "feminine", "gender_neutral"]).optional(),
            limit: z.number().int().min(1).max(100).default(20),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: search_voices ----
        const paywallMessage = await premiumRequired("search_voices");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await searchVoices(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("language_roll_call", {
        title: "Language roll call",
        description: "Walk the Cartesia voice library with cursor pagination and count it by language and gender, then list the voices that speak the most locales.",
        inputSchema: z.object({
            pages: z.number().int().min(1).max(10).default(3).describe("Pages of 100 to walk, default 3"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: language_roll_call ----
        const paywallMessage = await premiumRequired("language_roll_call");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await languageRollCall(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("pick_voice", {
        title: "Pick a voice",
        description: "Shortlist voices for a job: filter by language, rank by how many locales each voice speaks, prefer ones whose description matches your use case, and flag which have previews.",
        inputSchema: z.object({
            language: z.string().describe("Two-letter language code, e.g. en"),
            use_case: z.string().optional().describe("What the voice is for, e.g. narration, support, promo"),
            limit: z.number().int().min(1).max(25).default(8),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pickVoice(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
