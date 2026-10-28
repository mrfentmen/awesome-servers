export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function seasons(a: {
    limit?: number;
}): Promise<string>;
export declare function schedule(a: {
    year: number;
    limit?: number;
}): Promise<string>;
export declare function raceResults(a: {
    year: number;
    round: number;
    limit?: number;
}): Promise<string>;
export declare function driverStandings(a: {
    year: number;
    round?: number;
    limit?: number;
}): Promise<string>;
