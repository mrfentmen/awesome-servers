export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function network_by_asn(a: {
    asn: number;
}): Promise<string>;
export declare function network_search(a: {
    name: string;
    limit?: number;
}): Promise<string>;
export declare function exchange_search(a: {
    name: string;
    limit?: number;
}): Promise<string>;
export declare function facility_search(a: {
    name: string;
    limit?: number;
}): Promise<string>;
export declare function network_contacts(a: {
    asn: number;
}): Promise<string>;
