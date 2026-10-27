export declare class DirectusError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listCollections(): Promise<string>;
export declare function listUsers(limit?: string): Promise<string>;
export interface FieldsArgs {
    collection?: string;
    limit?: number;
}
/** The data model: every field in the project with its type, interface, constraints and relational target. */
export declare function collectionFields(args?: FieldsArgs): Promise<string>;
export interface AccessReviewArgs {
    include_permissions?: string;
}
/** Who can do what: roles, policies, the permissions attached to them, and the admin or TFA flags that matter. */
export declare function accessReview(args?: AccessReviewArgs): Promise<string>;
export interface InstanceHealthArgs {
    check_dependencies?: string;
}
/** The instance's own version and health, which decides which features are available and what is failing. */
export declare function instanceHealth(args?: InstanceHealthArgs): Promise<string>;
