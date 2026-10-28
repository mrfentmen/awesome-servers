export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function item_detail(a: {
    id: string;
}): Promise<string>;
export declare function collections(a: {
    limit?: number;
}): Promise<string>;
export declare function collection_detail(a: {
    slug: string;
}): Promise<string>;
export declare function search_format(a: {
    query: string;
    format: string;
    limit?: number;
}): Promise<string>;
