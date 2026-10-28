export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clean(s: unknown): string;
export declare function dailySummaries(a: {
    station: string;
    startDate: string;
    endDate: string;
    units?: string;
}): Promise<string>;
export declare function monthlySummaries(a: {
    station: string;
    year: number;
    units?: string;
}): Promise<string>;
export declare function stationExtremes(a: {
    station: string;
    startDate: string;
    endDate: string;
    units?: string;
}): Promise<string>;
