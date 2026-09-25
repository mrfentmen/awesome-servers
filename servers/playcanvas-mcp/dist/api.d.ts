export declare class PlayCanvasError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProjectAssets(projectId: string, branchId: string, limit?: string): Promise<string>;
export declare function getAsset(assetId: string, branchId: string): Promise<string>;
export declare function getRateLimits(): Promise<string>;
