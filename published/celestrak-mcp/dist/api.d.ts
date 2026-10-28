export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function satellites_by_group(a: {
    group: string;
    limit?: number;
}): Promise<string>;
export declare function satellite_by_catnr(a: {
    catnr: number;
}): Promise<string>;
export declare function satellite_by_name(a: {
    name: string;
}): Promise<string>;
export declare function satcat_by_catnr(a: {
    catnr: number;
}): Promise<string>;
export declare function groups(a: Record<string, never>): Promise<string>;
