export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function latestCotReport(a: {
    market: string;
}): Promise<string>;
export declare function cotHistory(a: {
    market: string;
    limit: number;
}): Promise<string>;
export declare function searchMarkets(a: {
    query: string;
    limit: number;
}): Promise<string>;
export declare function positioningExtremes(a: {
    limit: number;
}): Promise<string>;
export declare function openInterestLeaders(a: {
    limit: number;
}): Promise<string>;
export declare function cotAverages(a: {
    market: string;
    weeks: number;
}): Promise<string>;
