export declare class SourceError extends Error {
}
export declare function solveNonogram(a: {
    rows: number[][];
    cols: number[][];
}): Promise<string>;
export declare function checkNonogram(a: {
    grid: string[];
    rows: number[][];
    cols: number[][];
}): Promise<string>;
export declare function cluesFromGrid(a: {
    grid: string[];
}): Promise<string>;
