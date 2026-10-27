export declare class AirtableError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listBases(): Promise<string>;
export declare function listTables(baseId: string): Promise<string>;
export declare function listRecords(baseId: string, table: string, maxRecords?: string): Promise<string>;
export declare function getRecord(baseId: string, table: string, recordId: string): Promise<string>;
export declare function searchRecords(baseId: string, table: string, formula: string, maxRecords?: string): Promise<string>;
export declare function createRecord(baseId: string, table: string, fieldsJson: string): Promise<string>;
export declare function updateRecord(baseId: string, table: string, recordId: string, fieldsJson: string): Promise<string>;
export declare function deleteRecord(baseId: string, table: string, recordId: string): Promise<string>;
export declare function listWebhooks(baseId: string): Promise<string>;
export declare function recordComments(baseId: string, table: string, recordId: string): Promise<string>;
