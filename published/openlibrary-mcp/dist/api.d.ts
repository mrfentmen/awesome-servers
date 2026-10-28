export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_books(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function work(a: {
    workId: string;
}): Promise<string>;
export declare function author(a: {
    authorId: string;
}): Promise<string>;
export declare function isbn_lookup(a: {
    isbn: string;
}): Promise<string>;
export declare function subject(a: {
    subject: string;
    limit?: number;
}): Promise<string>;
