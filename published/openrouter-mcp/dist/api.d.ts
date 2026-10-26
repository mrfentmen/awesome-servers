export declare class OpenRouterError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listModels(): Promise<string>;
export declare function keyInfo(): Promise<string>;
export declare function credits(): Promise<string>;
export declare function getModel(modelId: string): Promise<string>;
export declare function searchModels(query: string, limit?: string): Promise<string>;
export declare function freeModels(limit?: string): Promise<string>;
export declare function longestContext(limit?: string): Promise<string>;
export declare function modelEndpoints(author: string, slug: string): Promise<string>;
export declare function generationStats(generationId: string): Promise<string>;
/** What a request will actually cost, at the prices OpenRouter publishes right now. */
export declare function promptCostEstimate(args: {
    input_tokens?: number;
    output_tokens?: number;
    model?: string;
    compare?: number;
}): Promise<string>;
/** The shape of the catalogue as a market: where prices sit, and what is concentrated. */
export declare function modelEconomicsMatrix(_args: Record<string, never>): Promise<string>;
/** Which models are being retired, and how fresh the catalogue actually is. */
export declare function deprecationWatch(args: {
    limit?: number;
}): Promise<string>;
