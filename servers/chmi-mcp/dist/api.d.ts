export declare class ChmiError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function browse(path?: string): Promise<string>;
export declare function getFile(path: string): Promise<string>;
export declare function getLatestAlert(): Promise<string>;
export interface DirectoryStatsArgs {
    path?: string;
    top?: number;
}
export interface DirectoryTreeArgs {
    path?: string;
    depth?: number;
    limit?: number;
}
export interface FindDocumentsArgs {
    query: string;
    path?: string;
    depth?: number;
    limit?: number;
}
