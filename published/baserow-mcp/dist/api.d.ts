export declare class BaserowError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getDashboard(): Promise<string>;
export declare function listTables(databaseId: string): Promise<string>;
