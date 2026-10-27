export declare class FederalRegisterError extends Error {
}
export declare function searchDocuments(term?: string, type?: string, fromDate?: string, toDate?: string, page?: number, perPage?: number): Promise<any>;
export declare function getDocument(documentNumber: string): Promise<any>;
export declare function listAgencies(): Promise<any>;
export declare function format(value: unknown): string;
export interface CommentPeriodsArgs {
    days?: number;
    limit?: number;
    type?: string;
}
export interface DocumentCountsArgs {
    term: string;
}
export declare function documentCounts(args: DocumentCountsArgs): Promise<string>;
