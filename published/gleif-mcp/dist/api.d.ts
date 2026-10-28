export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_by_name(a: {
    name: string;
    limit?: number;
}): Promise<string>;
export declare function lei_record(a: {
    lei: string;
}): Promise<string>;
export declare function ultimate_parent(a: {
    lei: string;
}): Promise<string>;
export declare function direct_children(a: {
    lei: string;
    limit?: number;
}): Promise<string>;
export declare function fuzzy_search(a: {
    name: string;
}): Promise<string>;
