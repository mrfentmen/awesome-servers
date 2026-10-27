export declare class ContractError extends Error {
}
export declare function analyze(project: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;
