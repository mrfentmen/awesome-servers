export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function network_info(a: {
    resource: string;
}): Promise<string>;
export declare function prefix_overview(a: {
    resource: string;
    limit?: number;
}): Promise<string>;
export declare function as_overview(a: {
    asn: string;
}): Promise<string>;
export declare function announced_prefixes(a: {
    asn: string;
    limit?: number;
}): Promise<string>;
export declare function asn_neighbours(a: {
    asn: string;
    limit?: number;
}): Promise<string>;
