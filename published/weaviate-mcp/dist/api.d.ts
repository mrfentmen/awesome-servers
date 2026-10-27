export declare class WeaviateError extends Error {
}
type Raw = Record<string, any>;
export interface WvClass {
    name: string;
    properties: string[];
}
export declare function listClasses(): Promise<WvClass[]>;
export declare function listObjects(className: string, limit?: number): Promise<Raw[]>;
export declare function graphqlQuery(query: string): Promise<Raw>;
export declare function formatObject(o: Raw, index?: number): string;
export interface WeaviateSchemaArgs {
    schema: string;
}
export interface WeaviateDiffArgs {
    before: string;
    after: string;
}
export declare function schemaDiff(args: WeaviateDiffArgs): Promise<string>;
export {};
