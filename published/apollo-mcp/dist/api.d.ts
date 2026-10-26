export declare class ApolloError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function health(): Promise<string>;
export declare function matchPerson(email?: string, firstName?: string, lastName?: string, organization?: string): Promise<string>;
export declare function searchPeople(query: string, limit?: string): Promise<string>;
export declare function peopleSearch(query: string, limit?: string): Promise<string>;
export declare function companySearch(query: string, limit?: string): Promise<string>;
export declare function orgEnrich(domain: string): Promise<string>;
export declare function bulkMatch(emails: string): Promise<string>;
export declare function getContact(contactId: string): Promise<string>;
export declare function accountSearch(query: string, limit?: string): Promise<string>;
export declare function peopleSearchV1(titles: string, limit?: string): Promise<string>;
