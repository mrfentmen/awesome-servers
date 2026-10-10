export declare class FreshdeskError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listTickets(): Promise<string>;
export declare function getTicket(ticketId: string): Promise<string>;
export declare function listContacts(): Promise<string>;
export declare function contactDetails(contactId: string): Promise<string>;
export declare function agents(): Promise<string>;
export declare function companies(): Promise<string>;
export declare function groups(): Promise<string>;
export declare function conversations(ticketId: string): Promise<string>;
export declare function satisfaction(): Promise<string>;
export declare function canned(): Promise<string>;
export interface ServiceStatusArgs {
    status_page: string;
    limit: number;
}
export declare function serviceStatus(args: ServiceStatusArgs): Promise<string>;
export interface DomainCertificatesArgs {
    domain: string;
    limit: number;
    include_expired: boolean;
}
export declare function domainCertificates(args: DomainCertificatesArgs): Promise<string>;
