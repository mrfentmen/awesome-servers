export declare class TeedyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function login(username: string, password: string): Promise<string>;
export declare function listDocuments(search?: string): Promise<string>;
export declare function getDocument(docId: string): Promise<string>;
export declare function listDocumentFiles(docId: string): Promise<string>;
