export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function lookupPostcode(a: {
    country: string;
    postcode: string;
}): Promise<string>;
export declare function lookupPostcodes(a: {
    country: string;
    postcodes: string[];
}): Promise<string>;
export declare function supportedCountries(): Promise<string>;
