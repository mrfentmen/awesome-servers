export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function facilities_in_state(a: {
    state: string;
    activeOnly?: boolean;
    limit?: number;
}): Promise<string>;
export declare function facilities_by_zip(a: {
    zip: string;
    limit?: number;
}): Promise<string>;
export declare function facilities_by_city(a: {
    city: string;
    state: string;
    limit?: number;
}): Promise<string>;
export declare function facilities_by_name(a: {
    name: string;
    state?: string;
    limit?: number;
}): Promise<string>;
export declare function facility_detail(a: {
    registryId: string;
}): Promise<string>;
