/**
 * DNS-over-HTTPS client, keyless.
 * Cloudflare, Google and AdGuard all serve the RFC 8484 JSON API over HTTP.
 */
export declare class DohError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
/** Resolvers that speak the DoH JSON API. */
export declare const PROVIDERS: Record<string, string>;
export declare const PROVIDER_NAMES: string[];
export declare const RECORD_TYPES: readonly ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "CAA", "SRV", "PTR"];
export interface DohAnswer {
    name: string;
    type: number;
    TTL: number;
    data: string;
}
export interface DohResult {
    status: number;
    statusText: string;
    comment?: string;
    answers: DohAnswer[];
    authority: DohAnswer[];
}
export declare function typeName(code: number): string;
export declare function rcodeName(code: number): string;
export declare function normaliseProvider(provider?: string): string;
export declare function normaliseType(type?: string): string;
/** One lookup. Returns status instead of throwing, so callers can report NXDOMAIN. */
export declare function resolve(name: string, type: string, provider: string): Promise<DohResult>;
/** Unwrap the quoted chunks a TXT record is split into. */
export declare function txtValue(data: string): string;
/** Split a CAA record into flags, tag and value. */
export declare function caaParts(data: string): {
    flags: number;
    tag: string;
    value: string;
};
export declare function formatAnswer(name: string, type: string, provider: string, res: DohResult): string;
export declare function resolveMany(names: string[], type: string, provider: string): Promise<string>;
export declare function recordSummary(domain: string, provider: string): Promise<string>;
export declare function emailRecords(domain: string, provider: string): Promise<string>;
export declare function caaRecords(domain: string, provider: string): Promise<string>;
export declare function reverseName(ip: string): string;
export declare function reverseLookup(ip: string, provider: string): Promise<string>;
export declare function providersHelp(): string;
export declare function dnssecCheck(args: {
    domain: string;
    provider?: string;
}): Promise<string>;
export declare function propagationCheck(args: {
    name: string;
    type?: string;
    provider?: string;
}): Promise<string>;
export declare function txtContains(args: {
    domain: string;
    value: string;
    provider?: string;
}): Promise<string>;
export interface DiagnoseArgs {
    name: string;
    type?: string;
    provider?: string;
}
export interface DelegationArgs {
    domain: string;
    max_hops?: number;
    provider?: string;
}
export interface WildcardArgs {
    domain: string;
    provider?: string;
}
/** Whether a zone answers for any name at all, which is the usual reason an unexpected record resolves. */
export declare function wildcardCheck(args: WildcardArgs): Promise<string>;
