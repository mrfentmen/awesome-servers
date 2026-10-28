export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clean(s: unknown): string;
export declare function soilProperties(a: {
    lat: number;
    lon: number;
    properties?: string;
    depths?: string;
}): Promise<string>;
export declare function classifySoil(a: {
    lat: number;
    lon: number;
    classes?: number;
}): Promise<string>;
export declare function listSoilCodes(): Promise<string>;
