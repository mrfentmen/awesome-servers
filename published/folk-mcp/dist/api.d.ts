export declare class FolkError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listPeople(limit?: string): Promise<string>;
export declare function getPerson(personId: string): Promise<string>;
export declare function listGroups(): Promise<string>;
export interface EmailDomainDnsArgs {
    email: string;
}
export declare function emailDomainDns(args: EmailDomainDnsArgs): Promise<string>;
export interface DomainRegistrationArgs {
    domain: string;
}
export declare function domainRegistration(args: DomainRegistrationArgs): Promise<string>;
