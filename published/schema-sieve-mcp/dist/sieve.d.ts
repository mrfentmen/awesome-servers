export declare class SieveError extends Error {
}
export declare function inspect(file: string): Promise<Record<string, unknown>>;
export declare function plan(file: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;
export declare const limits: {
    MAX_BYTES: number;
    MAX_DEPTH: number;
    MAX_PROPERTIES: number;
};
