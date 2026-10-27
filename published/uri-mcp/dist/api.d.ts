export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function parseUrl(a: {
    url: string;
}): Promise<string>;
export declare function encodeUrl(a: {
    text: string;
    component?: boolean;
}): Promise<string>;
export declare function decodeUrl(a: {
    text: string;
}): Promise<string>;
export declare function base64Encode(a: {
    text: string;
    urlSafe?: boolean;
}): Promise<string>;
export declare function base64Decode(a: {
    text: string;
    urlSafe?: boolean;
}): Promise<string>;
