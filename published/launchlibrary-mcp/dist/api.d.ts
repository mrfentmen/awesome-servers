export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function upcoming_launches(a: {
    limit?: number;
}): Promise<string>;
export declare function launch_by_id(a: {
    id: string;
}): Promise<string>;
export declare function search_launches(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function agencies(a: {
    limit?: number;
}): Promise<string>;
export declare function pads(a: {
    limit?: number;
}): Promise<string>;
export declare function events(a: {
    limit?: number;
}): Promise<string>;
