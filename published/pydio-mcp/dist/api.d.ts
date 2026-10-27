export declare class PydioError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listWorkspaces(): Promise<string>;
export declare function getTreeStats(nodePaths: string): Promise<string>;
