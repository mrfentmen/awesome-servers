export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function screen_name(a: {
    name: string;
    limit?: number;
}): Promise<string>;
export declare function entry_detail(a: {
    number: string;
}): Promise<string>;
export declare function entries_by_program(a: {
    program: string;
    limit?: number;
}): Promise<string>;
export declare function entries_by_type(a: {
    type: string;
    limit?: number;
}): Promise<string>;
export declare function list_stats(a: Record<string, never>): Promise<string>;
