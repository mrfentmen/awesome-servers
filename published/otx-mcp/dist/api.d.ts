export declare class OtxError extends Error {
}
export interface Pulse {
    id?: string;
    name?: string;
    author?: string;
    indicators?: number;
    modified?: string;
}
export declare function searchPulses(query: string, limit?: number): Promise<Pulse[]>;
export declare function pulseIndicators(id: string, limit?: number): Promise<string[]>;
export declare function ipReputation(ip: string): Promise<string>;
export declare function formatPulse(p: Pulse, index?: number): string;
export interface ReportArgs {
    indicator: string;
    type: string;
}
/** Full OTX record for any indicator type: IP, domain, hostname, file hash, CVE. */
export declare function indicatorReport(args: ReportArgs): Promise<string>;
export interface PulsesArgs {
    indicator: string;
    type: string;
    limit?: number;
}
/** The community pulses an indicator belongs to, newest first. */
export declare function indicatorPulses(args: PulsesArgs): Promise<string>;
export interface UrlsArgs {
    indicator: string;
    type: string;
    limit?: number;
}
/** URLs an indicator has been seen hosting or talking to. */
export declare function indicatorUrls(args: UrlsArgs): Promise<string>;
