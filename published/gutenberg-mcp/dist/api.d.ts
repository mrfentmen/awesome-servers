export declare class GutenbergError extends Error {
}
export declare function searchBooks(query: string, limit: number): Promise<string>;
export declare function bookDetail(id: number): Promise<string>;
export declare function byLanguage(language: string, limit: number): Promise<string>;
export declare function popular(limit: number): Promise<string>;
