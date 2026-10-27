export declare class OrbitError extends Error {
}
type ParsedWorktree = {
    path: string;
    detached: boolean;
    locked: boolean;
    prunable: boolean;
};
export declare function parseWorktreePorcelain(output: string): ParsedWorktree[];
export declare function inspectTopology(input: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;
export {};
