export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function systems(a: Record<string, never>): Promise<string>;
export declare function station_status(a: {
    city?: string;
    search?: string;
    limit?: number;
}): Promise<string>;
export declare function station_info(a: {
    city?: string;
    search?: string;
    limit?: number;
}): Promise<string>;
export declare function free_bikes(a: {
    city?: string;
    limit?: number;
}): Promise<string>;
export declare function system_info(a: {
    city?: string;
}): Promise<string>;
