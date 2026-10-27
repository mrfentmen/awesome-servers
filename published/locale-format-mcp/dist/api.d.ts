export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function formatNumber(a: {
    value: number;
    locale: string;
    style: string;
    currency: string;
    unit: string;
    decimals?: number;
}): Promise<string>;
export declare function formatDate(a: {
    value: string;
    locale: string;
    style: string;
    timeZone: string;
}): Promise<string>;
export declare function formatRelative(a: {
    value: string;
    locale: string;
    base?: string;
}): Promise<string>;
