export declare class GodotError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchAssets(filter?: string, godotVersion?: string, assetType?: string, category?: string, maxResults?: string, sort?: string): Promise<string>;
export declare function getAsset(assetId: string): Promise<string>;
export declare function getConfigure(): Promise<string>;
