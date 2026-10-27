export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function sunMoonDay(a: {
    date: string;
    latitude: number;
    longitude: number;
    timeZone: number;
}): Promise<string>;
export declare function moonPhases(a: {
    year: number;
    limit: number;
}): Promise<string>;
export declare function seasons(a: {
    year: number;
    timeZone: number;
}): Promise<string>;
