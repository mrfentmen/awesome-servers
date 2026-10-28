/**
 * JSON Schema Validator — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function validateJson(a: {
    schema: string;
    instance: string;
    maxErrors?: number;
}): Promise<string>;
export declare function describeSchema(a: {
    schema: string;
    depth?: number;
}): Promise<string>;
export declare function exampleFromSchema(a: {
    schema: string;
}): Promise<string>;
