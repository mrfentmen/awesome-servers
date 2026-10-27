export declare class ContractDiffError extends Error {
}
export declare function load(file: string): Promise<unknown>;
export declare function compareSnapshots(beforeFile: string, afterFile: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;
