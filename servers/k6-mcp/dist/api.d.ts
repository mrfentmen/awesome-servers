export declare class K6Error extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getStatus(): Promise<string>;
export declare function listMetrics(): Promise<string>;
/** A request waterfall: DNS, TCP, TLS, time to first byte and full download, measured separately. */
export declare function requestWaterfall(args: {
    url: string;
    timeout_ms?: number;
    bytes?: number;
}): Promise<string>;
/** A small load test: sample the endpoint repeatedly and report the latency distribution and status mix. */
export declare function loadSample(args: {
    url: string;
    samples?: number;
    concurrency?: number;
    timeout_ms?: number;
}): Promise<string>;
