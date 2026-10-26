export declare class HubspotError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listContacts(limit?: string): Promise<string>;
export declare function listCompanies(limit?: string): Promise<string>;
export declare function listDeals(limit?: string): Promise<string>;
export declare function listTickets(limit?: string): Promise<string>;
export declare function listOwners(): Promise<string>;
export declare function getContact(contactId: string): Promise<string>;
export declare function getCompany(companyId: string): Promise<string>;
export declare function getDeal(dealId: string): Promise<string>;
export declare function searchContacts(email: string): Promise<string>;
export declare function dealPipelines(): Promise<string>;
/** Is this a company, and where is it legally registered? From the GLEIF legal entity index. */
export declare function legalEntityLookup(args: {
    name: string;
    limit?: number;
}): Promise<string>;
/** Is this an SEC registrant, what industry does the SEC file it under, and what has it filed lately? */
export declare function secCompany(args: {
    name: string;
    limit?: number;
}): Promise<string>;
