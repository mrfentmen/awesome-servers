export declare class ThegraphError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function querySubgraph(subgraphId: string, query: string, variables?: string): Promise<string>;
export declare function getSubgraphSchema(subgraphId: string): Promise<string>;
export declare function getLatestBlock(subgraphId: string): Promise<string>;
