export declare class SavvyCalError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listLinks(): Promise<string>;
export declare function getLink(linkId: string): Promise<string>;
export declare function getCurrentUser(): Promise<string>;
export declare function listEvents(): Promise<string>;
