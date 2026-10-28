/**
 * SQL Formatter — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function formatSql(a: {
    sql: string;
    indent?: number;
    uppercaseKeywords?: boolean;
}): Promise<string>;
export declare function minifySql(a: {
    sql: string;
    stripComments?: boolean;
}): Promise<string>;
export declare function splitStatements(a: {
    sql: string;
}): Promise<string>;
