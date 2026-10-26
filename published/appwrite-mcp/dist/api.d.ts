export declare class AppwriteError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listUsers(limit?: string): Promise<string>;
export declare function listDatabases(): Promise<string>;
