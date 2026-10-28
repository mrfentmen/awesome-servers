export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_organizations(a: {
    query: string;
    state?: string;
    limit?: number;
}): Promise<string>;
export declare function search_by_state(a: {
    state: string;
    limit?: number;
}): Promise<string>;
export declare function organization(a: {
    ein: string;
}): Promise<string>;
export declare function filings(a: {
    ein: string;
}): Promise<string>;
export declare function financials(a: {
    ein: string;
}): Promise<string>;
