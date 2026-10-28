export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function metar(a: {
    ids: string;
    limit?: number;
}): Promise<string>;
export declare function taf(a: {
    ids: string;
}): Promise<string>;
export declare function airport_info(a: {
    ids: string;
}): Promise<string>;
export declare function station_info(a: {
    ids: string;
}): Promise<string>;
export declare function decode_metar(a: {
    raw: string;
}): Promise<string>;
