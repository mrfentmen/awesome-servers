export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function agency_totals(a: {
    limit?: number;
}): Promise<string>;
export declare function agency_detail(a: {
    code: string;
}): Promise<string>;
export declare function award_search(a: {
    keyword: string;
    limit?: number;
}): Promise<string>;
export declare function recipient_search(a: {
    keyword: string;
    limit?: number;
}): Promise<string>;
export declare function top_recipients(a: {
    limit?: number;
}): Promise<string>;
