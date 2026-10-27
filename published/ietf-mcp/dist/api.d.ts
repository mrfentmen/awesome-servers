export declare class IetfError extends Error {
}
export declare function searchDocuments(query: string, limit?: number, offset?: number): Promise<unknown>;
export declare function getDocument(name: string): Promise<unknown>;
export declare function searchGroups(query: string, limit?: number): Promise<unknown>;
export declare function listMeetings(limit?: number): Promise<unknown>;
export declare function format(value: unknown): string;
export interface GroupProfileArgs {
    acronym: string;
}
export interface GroupHistoryArgs {
    acronym: string;
    limit?: number;
}
export interface DocumentAuthorsArgs {
    name: string;
    limit?: number;
}
export declare function documentAuthors(args: DocumentAuthorsArgs): Promise<string>;
