export declare class DocumensoError extends Error {
}
export interface Document {
    id: string;
    title?: string;
    status?: string;
    created?: string;
}
export declare function listDocuments(limit?: number): Promise<Document[]>;
export interface DocumentDetails extends Document {
    recipients: string[];
}
export declare function getDocument(id: string): Promise<DocumentDetails>;
export declare function formatDocument(d: DocumentDetails | Document, index?: number): string;
export declare function instanceHealth(): Promise<string>;
export interface DocRecipient {
    email: string;
    name?: string;
    role?: string;
    order?: number;
}
export interface DocField {
    label: string;
    type: string;
    for?: string;
}
export interface DocPlanArgs {
    recipients: DocRecipient[];
    fields?: DocField[];
    envelope_id?: string;
}
