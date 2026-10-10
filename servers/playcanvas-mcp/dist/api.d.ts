export declare class PlayCanvasError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProjectAssets(projectId: string, branchId: string, limit?: string): Promise<string>;
export declare function getAsset(assetId: string, branchId: string): Promise<string>;
export declare function getRateLimits(): Promise<string>;
/**
 * The engine's current release channels: what latest, lts, beta and preview all
 * point at, and how old each of those is. This is the version-picking question
 * a project has to answer before it upgrades anything.
 */
export declare function engineReleaseChannels(args: {
    includePrerelease?: boolean;
}): Promise<string>;
/**
 * The engine's release notes: what changed in each published release, pulled
 * from the GitHub release body, so a changelog can be read without a browser.
 */
export declare function engineReleaseNotes(args: {
    limit?: number;
    includePrerelease?: boolean;
}): Promise<string>;
