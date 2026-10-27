export declare class FaunaError extends Error {
}
export declare function listCollections(): Promise<string[]>;
export declare function runQuery(fql: string): Promise<string>;
export interface FqlCompareArgs {
    before: string;
    after: string;
}
export declare function fqlCompare(args: FqlCompareArgs): Promise<string>;
