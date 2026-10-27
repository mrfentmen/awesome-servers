export declare class LogtoError extends Error {
}
export interface LogtoUser {
    id: string;
    username?: string;
    email?: string;
    created?: string;
}
export declare function listUsers(limit?: number): Promise<LogtoUser[]>;
export interface LogtoApp {
    id: string;
    name?: string;
    type?: string;
}
export declare function listApplications(limit?: number): Promise<LogtoApp[]>;
export declare function tenantDiscovery(args: {
    url?: string;
}): Promise<string>;
export declare function signingKeys(args: {
    url?: string;
}): Promise<string>;
export interface LogtoTokenArgs {
    token: string;
    expected_issuer?: string;
}
export declare function tokenInspect(args: LogtoTokenArgs): Promise<string>;
