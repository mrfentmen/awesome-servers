export declare class HasuraError extends Error {
}
type Raw = Record<string, any>;
export declare function exportMetadata(): Promise<Raw>;
export declare function runSql(sql: string, source?: string): Promise<Raw>;
export declare function formatMetadata(md: Raw): string;
export declare function formatSqlResult(r: Raw): string;
/** A census of a Hasura metadata document: every object kind it holds, and how the relationships and actions are shaped. */
export declare function metadataCensus(args: {
    metadata: string;
}): Promise<string>;
/** A dry run over a SQL statement: is it read only, what does it touch, and how much work is in it. */
export declare function sqlAudit(args: {
    sql: string;
}): Promise<string>;
/** Build a GraphQL document for a Hasura schema from the tables and fields you name, with a depth cap. */
export declare function graphqlBuilder(args: {
    tables?: string;
    fields?: string;
    depth?: number;
    operation?: string;
    alias?: string;
}): Promise<string>;
export {};
