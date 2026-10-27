export declare class ScoutError extends Error {
}
export declare function summary(file: string): Promise<unknown>;
export declare function operation(file: string, operationId: string): Promise<unknown>;
export declare function schemas(file: string): Promise<unknown>;
export declare function format(value: unknown): string;
