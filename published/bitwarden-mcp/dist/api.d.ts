export declare class BitwardenError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listMembers(): Promise<string>;
export declare function listCollections(): Promise<string>;
export declare function listGroups(): Promise<string>;
export declare function getEvents(start?: string, end?: string): Promise<string>;
export interface PoliciesArgs {
    continuation_token?: string;
}
/**
 * GET /public/policies
 * ListResponseModel: { object: "list", data: PolicyResponseModel[], continuationToken }
 * PolicyResponseModel: { object, id, type, enabled, data, revision_date }
 */
export declare function listPolicies(args: PoliciesArgs): Promise<string>;
export interface CollectionArgs {
    id: string;
}
/**
 * GET /public/collections/{id}
 * CollectionResponseModel: { object, id, externalId, name, groups: [{ id, readOnly, hidePasswords, manage }] }
 */
export declare function collectionAccess(args: CollectionArgs): Promise<string>;
export interface TwoFactorArgs {
    continuation_token?: string;
}
/**
 * GET /public/members, rolled up.
 * MemberResponseModel: { object, id, userId, name, email, twoFactorEnabled, status,
 *                        collections, type, accessAll, externalId }
 * status and type are numeric codes; they are reported as sent rather than labelled.
 */
export declare function twoFactorCoverage(args: TwoFactorArgs): Promise<string>;
