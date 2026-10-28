export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_loinc(a: {
    term: string;
    limit?: number;
}): Promise<string>;
export declare function loinc_detail(a: {
    code: string;
}): Promise<string>;
export declare function search_icd10(a: {
    term: string;
    limit?: number;
}): Promise<string>;
export declare function icd10_detail(a: {
    code: string;
}): Promise<string>;
export declare function search_conditions(a: {
    term: string;
    limit?: number;
}): Promise<string>;
