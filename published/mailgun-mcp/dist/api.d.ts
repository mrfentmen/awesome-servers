export declare class MailgunError extends Error {
}
export interface Domain {
    name: string;
    state?: string;
    created?: string;
}
export declare function listDomains(limit?: number): Promise<Domain[]>;
export interface DomainStats {
    sent?: number;
    delivered?: number;
    opened?: number;
    failed?: number;
}
export declare function domainStats(domain: string): Promise<DomainStats>;
export declare function listBounces(domain: string, limit?: number): Promise<string[]>;
export declare function formatStats(domain: string, s: DomainStats): string;
