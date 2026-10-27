export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function statistics(a: {
    values: number[];
    sample?: boolean;
}): Promise<string>;
export declare function toRoman(a: {
    value: number;
}): Promise<string>;
export declare function fromRoman(a: {
    roman: string;
}): Promise<string>;
export declare function convertBase(a: {
    value: string;
    fromBase: number;
    toBase: number;
}): Promise<string>;
export declare function formatNumber(a: {
    value: number;
    style?: string;
    locale?: string;
    currency?: string;
    decimals?: number;
}): Promise<string>;
