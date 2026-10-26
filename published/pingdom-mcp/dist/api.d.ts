export declare function errorMessage(e: unknown): string;
export declare function normalizeTarget(input: string): URL;
export declare function checkUrl(args: {
    url: string;
}): Promise<string>;
export declare function responseTimes(args: {
    url: string;
    samples?: number;
}): Promise<string>;
export declare function checkRedirects(args: {
    url: string;
}): Promise<string>;
export interface Timing {
    dnsMs: number;
    connectMs: number;
    tlsMs: number;
    firstByteMs: number;
    totalMs: number;
}
export declare function measureTiming(target: string): Promise<Timing>;
export declare function performanceReport(args: {
    url: string;
}): Promise<string>;
export declare function certificateExpiry(args: {
    host: string;
}): Promise<string>;
export declare function brokenLinks(args: {
    url: string;
    limit?: number;
}): Promise<string>;
