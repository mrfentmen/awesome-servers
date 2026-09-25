export declare class OpenLibraryError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchBooks(query: string, limit?: string): Promise<string>;
export declare function getWork(workId: string): Promise<string>;
export declare function getAuthor(authorId: string): Promise<string>;
