export declare class WikidataError extends Error {
}
export declare function search(query: string): Promise<any>;
export declare function entity(id: string): Promise<any>;
export declare function sparql(query: string): Promise<any>;
export declare function format(x: unknown): string;
