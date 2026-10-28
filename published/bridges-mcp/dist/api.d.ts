export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function ny_bridges(a: {
    county?: string;
    poorOnly?: boolean;
    limit?: number;
}): Promise<string>;
export declare function ny_bridge_by_bin(a: {
    bin: string;
}): Promise<string>;
export declare function ny_bridge_summary(a: {
    limit?: number;
}): Promise<string>;
export declare function nyc_bridges(a: {
    borough?: string;
    belowRating?: number;
    limit?: number;
}): Promise<string>;
export declare function nyc_bridge_by_bin(a: {
    bin: string;
}): Promise<string>;
