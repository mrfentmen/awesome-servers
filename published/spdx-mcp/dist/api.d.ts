export declare class SpdxError extends Error {
}
type License = {
    licenseId?: string;
    name?: string;
    reference?: string;
    detailsUrl?: string;
    isOsiApproved?: boolean;
    isFsfLibre?: boolean;
    isDeprecatedLicenseId?: boolean;
    seeAlso?: string[];
};
export declare function licenses(): Promise<License[]>;
export declare function find(query: string): Promise<License[]>;
export declare function get(id: string): Promise<License | null>;
export declare function format(rows: License[]): string;
export {};
