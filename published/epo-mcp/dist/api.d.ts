export declare class EpoError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function search(query: string, range?: string): Promise<string>;
export declare function family(country: string, number: string, kind: string): Promise<string>;
export interface PublicationRecordArgs {
    country: string;
    number: string;
    kind: string;
    include_abstract?: boolean;
}
/** The full publication document, where the existing search tool only returns a bibliographic hit list. */
export declare function publicationRecord(args: PublicationRecordArgs): Promise<string>;
export interface LegalStatusArgs {
    country: string;
    number: string;
    kind: string;
    limit?: number;
}
/** The INPADOC legal event list, which is what answers whether a right is still live. */
export declare function legalStatus(args: LegalStatusArgs): Promise<string>;
export interface EpoRegisterArgs {
    epodoc: string;
    limit?: number;
}
/** The EPO Register record itself, which is the authoritative source for a European filing. */
export declare function epoRegister(args: EpoRegisterArgs): Promise<string>;
