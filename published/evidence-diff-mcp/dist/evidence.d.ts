export declare class EvidenceError extends Error {
}
export declare function safeRoot(input: string): Promise<string>;
export declare function git(cwd: string, args: string[]): Promise<string>;
export declare function explainEvidence(input: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;
