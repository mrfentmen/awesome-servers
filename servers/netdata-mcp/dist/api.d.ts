export declare class NetdataError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getInfo(): Promise<string>;
export declare function listCharts(): Promise<string>;
export declare function getData(chart: string, points?: string): Promise<string>;
/** What Netdata is publishing right now: the newest tags and how fresh each one is. */
export declare function netdataReleaseCensus(args: {
    limit?: number;
    pageSize?: number;
}): Promise<string>;
/** Which platforms the current Netdata image actually ships, from its manifest index. */
export declare function netdataPlatformAudit(args: {
    tag?: string;
}): Promise<string>;
