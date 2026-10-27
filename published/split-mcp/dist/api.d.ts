export declare class SplitError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listWorkspaces(): Promise<string>;
export declare function listSplits(workspaceId: string): Promise<string>;
export declare function listSegments(workspaceId: string): Promise<string>;
