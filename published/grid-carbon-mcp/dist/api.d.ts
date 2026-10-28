export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function current_intensity(a: Record<string, never>): Promise<string>;
export declare function generation_mix(a: Record<string, never>): Promise<string>;
export declare function intensity_history(a: {
    from: string;
    to: string;
}): Promise<string>;
export declare function intensity_for_date(a: {
    date: string;
}): Promise<string>;
export declare function regional_intensity(a: Record<string, never>): Promise<string>;
