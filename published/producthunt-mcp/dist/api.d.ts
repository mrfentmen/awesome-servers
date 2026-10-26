export declare class PhError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function viewer(): Promise<string>;
export declare function listPosts(limit?: string): Promise<string>;
