export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function water_system(a: {
    pwsid: string;
}): Promise<string>;
export declare function search_systems(a: {
    state: string;
    name?: string;
    limit?: number;
}): Promise<string>;
export declare function violations(a: {
    pwsid: string;
    limit?: number;
}): Promise<string>;
export declare function enforcement(a: {
    pwsid: string;
    limit?: number;
}): Promise<string>;
export declare function systems_by_type(a: {
    state: string;
    systemType: string;
    limit?: number;
}): Promise<string>;
