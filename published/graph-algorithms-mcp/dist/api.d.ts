export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
type Edge = {
    from: string;
    to: string;
    weight?: number;
};
export declare function shortestPath(a: {
    edges: Edge[];
    from: string;
    to: string;
    directed: boolean;
}): Promise<string>;
export declare function topologicalSort(a: {
    edges: {
        from: string;
        to: string;
    }[];
}): Promise<string>;
export declare function connectedComponents(a: {
    edges: {
        from: string;
        to: string;
    }[];
    directed: boolean;
}): Promise<string>;
export {};
