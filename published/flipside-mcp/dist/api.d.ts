export declare class FlipsideError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function createQuery(sql: string, dataSource?: string, dataProvider?: string): Promise<string>;
export declare function getQueryStatus(token: string): Promise<string>;
export declare function getQueryResults(token: string, pageNumber?: number, pageSize?: number): Promise<string>;
export declare function cancelQuery(token: string): Promise<string>;
export interface SavedQueriesArgs {
    category?: string;
    search?: string;
    limit?: number;
}
/**
 * The library of queries Flipside publishes. Each one is a working piece of
 * analysis written by someone who knows the schema, which is the point: the
 * alternative is writing the SQL yourself against table names you have to
 * discover first.
 */
export declare function savedQueries(args: SavedQueriesArgs): Promise<string>;
export interface RunSavedQueryArgs {
    query_name: string;
    data_source?: string;
    data_provider?: string;
    limit?: number;
}
/** Runs one of Flipside's saved queries by name, which is the whole point of the library. */
export declare function runSavedQuery(args: RunSavedQueryArgs): Promise<string>;
export interface TableSchemaArgs {
    data_source: string;
    table?: string;
    search?: string;
}
/**
 * The metadata API: the table list for a chain, or the column layout of one
 * table. This is the missing prerequisite for every other tool here, because
 * create_query needs SQL written against column names that are documented
 * nowhere else.
 */
export declare function tableSchema(args: TableSchemaArgs): Promise<string>;
