export declare class KumaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getStatus(): Promise<string>;
export declare function getMetrics(): Promise<string>;
/**
 * Measures a URL the way a monitor does, phase by phase: name resolution, the TLS
 * handshake and its certificate, then the request itself, repeated so the median
 * can be reported instead of a single lucky sample. No configuration needed, which
 * is what makes it usable when the instance you watch is the thing that is down.
 */
export declare function httpProbe(args: {
    url: string;
    runs?: number;
}): Promise<string>;
/**
 * What the Uptime Kuma project itself is doing: the current release and when it
 * shipped, the releases before it, how active the issue tracker is, and what has
 * been touched most recently. An operator deciding whether to upgrade wants this
 * without logging into a dashboard.
 */
export declare function releaseWatch(args: {
    releases?: number;
    issues?: number;
}): Promise<string>;
