export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function object_lookup(a: {
    designation: string;
}): Promise<string>;
export declare function close_approaches(a: {
    designation: string;
    from?: string;
    to?: string;
}): Promise<string>;
export declare function query_objects(a: {
    kind?: string;
    limit?: number;
}): Promise<string>;
export declare function count_objects(a: {
    kind?: string;
}): Promise<string>;
export declare function orbit_classes(a: Record<string, never>): Promise<string>;
