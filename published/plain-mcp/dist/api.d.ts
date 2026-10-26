export declare class PlainError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listCustomers(limit?: string): Promise<string>;
export declare function listThreads(limit?: string): Promise<string>;
export declare function getThread(threadId: string): Promise<string>;
