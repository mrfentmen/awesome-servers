export declare class IetfError extends Error {
}
export declare function searchDocuments(query: string, limit?: number, offset?: number): Promise<unknown>;
export declare function getDocument(name: string): Promise<unknown>;
export declare function searchGroups(query: string, limit?: number): Promise<unknown>;
export declare function listMeetings(limit?: number): Promise<unknown>;
export declare function format(value: unknown): string;
