export declare class KopiaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listSources(): Promise<string>;
export declare function listSnapshots(): Promise<string>;
export declare function getRepoStatus(): Promise<string>;
export declare function getCurrentUser(): Promise<string>;
export declare function getTasksSummary(): Promise<string>;
