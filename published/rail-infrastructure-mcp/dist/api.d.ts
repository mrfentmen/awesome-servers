export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function crossings_by_state(a: {
    state: string;
    limit?: number;
}): Promise<string>;
export declare function crossing_detail(a: {
    crossingId: string;
}): Promise<string>;
export declare function bridges_by_state(a: {
    state: string;
    limit?: number;
}): Promise<string>;
export declare function bridge_search(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function rail_summary(a: {
    state: string;
}): Promise<string>;
