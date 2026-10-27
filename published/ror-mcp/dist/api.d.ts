export declare class RorError extends Error {
}
export declare function searchOrganizations(query: string, country?: string): Promise<string>;
export declare function organizationDetail(id: string): Promise<string>;
export declare function organizationsByCountry(country: string, limit?: number): Promise<string>;
export declare function organizationsByType(type: string, country?: string, limit?: number): Promise<string>;
export declare function organizationBatch(ids: string[]): Promise<string>;
