export declare class SupabaseError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function queryTable(table: string, select?: string, limit?: string): Promise<string>;
export declare function listUsers(page?: string): Promise<string>;
export declare function callRpc(fn: string, params?: string): Promise<string>;
export declare function storageBuckets(): Promise<string>;
export declare function storageObjects(bucket: string, limit?: string): Promise<string>;
export declare function authUser(userId: string): Promise<string>;
export declare function createUser(email: string, password?: string): Promise<string>;
export declare function deleteUser(userId: string): Promise<string>;
export declare function insertRow(table: string, rowJson: string): Promise<string>;
export declare function updateRows(table: string, rowId: string, patchJson: string): Promise<string>;
export declare function deleteRows(table: string, rowId: string): Promise<string>;
/**
 * Review a CREATE TABLE statement the way a Supabase project will actually be
 * used: row level security, primary keys, indexes on foreign keys, and the
 * column choices that only bite once the table has real data in it.
 */
export declare function schemaReview(args: {
    ddl?: string;
}): Promise<string>;
/** How the hosted platform is behaving, per region and per service. */
export declare function platformStatus(_args: Record<string, never>): Promise<string>;
/** Which Postgres versions are safe to run, and which are past end of life. */
export declare function postgresVersionWatch(_args: Record<string, never>): Promise<string>;
