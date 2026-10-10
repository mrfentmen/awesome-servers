export declare class ClerkError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listUsers(limit?: string): Promise<string>;
export declare function getUser(userId: string): Promise<string>;
export interface SessionsArgs {
    user_id?: string;
    client_id?: string;
    status?: string;
    limit?: string;
}
/** Active and recent sessions for one user, a client, or the whole instance. */
export declare function listSessions(args: SessionsArgs): Promise<string>;
export interface InvitationsArgs {
    status?: string;
    query?: string;
    order_by?: string;
    limit?: string;
}
/** Outstanding and historical sign-up invitations, so stale ones can be chased or revoked. */
export declare function listInvitations(args: InvitationsArgs): Promise<string>;
export interface MembershipsArgs {
    organization_id: string;
    role?: string;
    query?: string;
    last_active_at_before?: string;
    last_active_at_after?: string;
    limit?: string;
}
/** Who belongs to one organization and what they can do in it. */
export declare function listMemberships(args: MembershipsArgs): Promise<string>;
