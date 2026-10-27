export declare class LiteralError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getBooks(limit?: number, search?: string): Promise<string>;
export declare function getBooksByState(state: string, limit?: number): Promise<string>;
export declare function getBook(slug: string): Promise<string>;
