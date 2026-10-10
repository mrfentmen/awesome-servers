export declare class HackTargetError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function dnsLookup(query: string): Promise<string>;
export declare function reverseDns(ip: string): Promise<string>;
export declare function whoisLookup(query: string): Promise<string>;
export declare function geoIpLookup(query: string): Promise<string>;
export declare function httpHeaders(url: string): Promise<string>;
export declare function reverseIp(ip: string): Promise<string>;
