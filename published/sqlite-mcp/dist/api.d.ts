import { DatabaseSync } from "node:sqlite";
export declare class SqliteError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function openDb(dbPath: string): DatabaseSync;
export declare function query(dbPath: string, sql: string, params?: string[]): Promise<string>;
export declare function execute(dbPath: string, sql: string, params?: string[]): Promise<string>;
export declare function listTables(dbPath: string): Promise<string>;
export declare function describeTable(dbPath: string, table: string): Promise<string>;
