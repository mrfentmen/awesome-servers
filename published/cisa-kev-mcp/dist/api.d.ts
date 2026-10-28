export declare class KevError extends Error {
}
type Vuln = {
    cveID?: string;
    vendorProject?: string;
    product?: string;
    vulnerabilityName?: string;
    shortDescription?: string;
    dateAdded?: string;
    dueDate?: string;
    knownRansomwareCampaignUse?: string;
    notes?: string;
    cwes?: string[];
};
export declare function search(query: string): Promise<Vuln[]>;
export declare function recent(limit: number): Promise<Vuln[]>;
export declare function info(): Promise<{
    catalogVersion: string | undefined;
    dateReleased: string | undefined;
    count: number;
}>;
export declare function format(x: unknown): string;
export {};
