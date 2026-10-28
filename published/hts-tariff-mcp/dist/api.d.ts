export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_tariff(a: {
    keyword: string;
    limit?: number;
}): Promise<string>;
export declare function tariff_line(a: {
    htsno: string;
}): Promise<string>;
export declare function tariff_range(a: {
    from: string;
    to: string;
    limit?: number;
}): Promise<string>;
export declare function tariff_chapter(a: {
    chapter: string;
    limit?: number;
}): Promise<string>;
export declare function tariff_subtree(a: {
    prefix: string;
    limit?: number;
}): Promise<string>;
