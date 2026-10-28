export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function offices(a: Record<string, never>): Promise<string>;
export declare function projects(a: {
    office: string;
    limit?: number;
}): Promise<string>;
export declare function project(a: {
    office: string;
    name: string;
}): Promise<string>;
export declare function levels(a: {
    office: string;
    unit?: string;
    limit?: number;
}): Promise<string>;
export declare function time_series(a: {
    office: string;
    name: string;
    begin: string;
    end: string;
}): Promise<string>;
