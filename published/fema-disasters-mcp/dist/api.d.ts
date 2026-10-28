export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function recent_disasters(a: {
    limit?: number;
}): Promise<string>;
export declare function disasters_by_state(a: {
    state: string;
    limit?: number;
}): Promise<string>;
export declare function disasters_by_type(a: {
    type: string;
    limit?: number;
}): Promise<string>;
export declare function disasters_by_year(a: {
    year: number;
    limit?: number;
}): Promise<string>;
export declare function disaster_detail(a: {
    number: number;
}): Promise<string>;
