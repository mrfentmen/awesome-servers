export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function listProjects(a: {
    query?: string;
    limit?: number;
}): Promise<string>;
export declare function projectDetail(a: {
    projectId: string;
}): Promise<string>;
export declare function findGenes(a: {
    symbols: string;
}): Promise<string>;
