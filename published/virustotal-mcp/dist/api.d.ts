export declare class VirusTotalError extends Error {
}
export interface Verdict {
    target: string;
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    reputation?: number;
}
export declare function fileReport(hash: string): Promise<Verdict>;
export declare function urlReport(url: string): Promise<Verdict>;
export declare function domainReport(domain: string): Promise<Verdict>;
export declare function ipReport(ip: string): Promise<Verdict>;
export declare function formatVerdict(v: Verdict): string;
