export declare class SupercellError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getCocPlayer(tag: string): Promise<string>;
export declare function getCocClan(tag: string): Promise<string>;
export declare function searchCocClans(name: string, limit?: number): Promise<string>;
export declare function getRoyalePlayer(tag: string): Promise<string>;
export declare function getRoyaleClan(tag: string): Promise<string>;
export declare function getRoyaleTopClans(locationId?: string, limit?: number): Promise<string>;
