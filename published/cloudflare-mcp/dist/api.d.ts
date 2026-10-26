export declare class CloudflareError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listZones(): Promise<string>;
export declare function listAccounts(): Promise<string>;
export declare function listDns(zoneId: string): Promise<string>;
export declare function zoneDetails(zoneId: string): Promise<string>;
export declare function dnsRecord(zoneId: string, recordId: string): Promise<string>;
export declare function firewallRules(zoneId: string): Promise<string>;
export declare function pageRules(zoneId: string): Promise<string>;
export declare function workers(accountId: string): Promise<string>;
export declare function analytics(zoneId: string): Promise<string>;
export declare function tunnels(accountId: string): Promise<string>;
export interface ZoneSettingsArgs {
    zone_id: string;
    only_changed?: string;
}
/** Every tunable on a zone, with the ones that matter for transport security and caching called out. */
export declare function zoneSettings(args: ZoneSettingsArgs): Promise<string>;
export interface ZoneRulesetsArgs {
    zone_id: string;
    phase?: string;
}
/** The ruleset phases configured on a zone, which is where WAF, redirects and transforms actually live. */
export declare function zoneRulesets(args: ZoneRulesetsArgs): Promise<string>;
export interface OriginPullArgs {
    zone_id: string;
}
/** Origin pull certificates, which decide which client certificates the edge will accept. */
export declare function originPullCertificates(args: OriginPullArgs): Promise<string>;
