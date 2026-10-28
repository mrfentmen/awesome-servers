export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_clearances(a: {
    device: string;
    limit?: number;
}): Promise<string>;
export declare function clearance_detail(a: {
    kNumber: string;
}): Promise<string>;
export declare function clearances_by_applicant(a: {
    applicant: string;
    limit?: number;
}): Promise<string>;
export declare function clearances_by_product_code(a: {
    productCode: string;
    limit?: number;
}): Promise<string>;
export declare function clearances_by_year(a: {
    year: number;
    limit?: number;
}): Promise<string>;
export declare function clearance_stats(a: Record<string, never>): Promise<string>;
